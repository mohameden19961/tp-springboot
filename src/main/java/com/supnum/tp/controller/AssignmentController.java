package com.supnum.tp.controller;

import com.supnum.tp.model.*;
import com.supnum.tp.repository.*;
import com.supnum.tp.service.FileStorageService;
import com.supnum.tp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@RestController
@RequestMapping("/courses/{courseId}/assignments")
@Transactional
public class AssignmentController {

    @Autowired private AssignmentRepository assignmentRepository;
    @Autowired private SubmissionRepository submissionRepository;
    @Autowired private com.supnum.tp.service.CourseService courseService;
    @Autowired private CourseRepository courseRepository;
    @Autowired private UserService userService;
    @Autowired private FileStorageService fileStorageService;

    private Course getAccessibleCourse(Long courseId) {
        return courseService.getById(courseId);
    }

    private void verifyTeacher(Course course) {
        User currentUser = userService.getCurrentUser();
        if (!course.getTeacher().getId().equals(currentUser.getId()) && !"ADMIN".equals(currentUser.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Seul le professeur peut effectuer cette action");
        }
    }

    @GetMapping
    public List<Assignment> getAssignments(@PathVariable Long courseId) {
        Course course = getAccessibleCourse(courseId);
        return assignmentRepository.findByCourseOrderByIdDesc(course);
    }

    @PostMapping
    public Assignment createAssignment(@PathVariable Long courseId, @RequestBody Assignment assignmentReq) {
        Course course = courseRepository.findById(courseId).orElseThrow();
        verifyTeacher(course);
        assignmentReq.setCourse(course);
        return assignmentRepository.save(assignmentReq);
    }

    // --- Submissions ---

    @GetMapping("/{assignmentId}/submissions")
    public List<Submission> getSubmissions(@PathVariable Long courseId, @PathVariable Long assignmentId) {
        Course course = getAccessibleCourse(courseId);
        verifyTeacher(course);
        Assignment assignment = assignmentRepository.findById(assignmentId).orElseThrow();
        return submissionRepository.findByAssignmentOrderByIdDesc(assignment);
    }

    @GetMapping("/{assignmentId}/my-submission")
    public Submission getMySubmission(@PathVariable Long courseId, @PathVariable Long assignmentId) {
        getAccessibleCourse(courseId);
        User currentUser = userService.getCurrentUser();
        Assignment assignment = assignmentRepository.findById(assignmentId).orElseThrow();
        return submissionRepository.findByAssignmentAndStudentOrderByIdDesc(assignment, currentUser).stream().findFirst().orElse(null);
    }

    @PostMapping("/{assignmentId}/submit")
    public Submission submitWork(@PathVariable Long courseId, 
                                @PathVariable Long assignmentId,
                                @RequestParam(value = "content", required = false) String content,
                                @RequestParam(value = "file", required = false) MultipartFile file) {
        getAccessibleCourse(courseId);
        User currentUser = userService.getCurrentUser();
        Assignment assignment = assignmentRepository.findById(assignmentId).orElseThrow();

        Submission submission = submissionRepository.findByAssignmentAndStudentOrderByIdDesc(assignment, currentUser)
                .stream().findFirst().orElse(new Submission());
        
        submission.setAssignment(assignment);
        submission.setStudent(currentUser);
        
        if (file != null && !file.isEmpty()) {
            String fileName = fileStorageService.storeFile(file);
            submission.setFileName(fileName);
        }
        
        if (content != null) {
            submission.setContent(content);
        }

        return submissionRepository.save(submission);
    }

    @PostMapping("/{assignmentId}/submissions/{submissionId}/grade")
    public Submission gradeSubmission(@PathVariable Long courseId,
                                    @PathVariable Long assignmentId,
                                    @PathVariable Long submissionId,
                                    @RequestParam Double grade,
                                    @RequestParam(required = false) String feedback) {
        Course course = courseRepository.findById(courseId).orElseThrow();
        verifyTeacher(course);
        
        Submission submission = submissionRepository.findById(submissionId).orElseThrow();
        submission.setGrade(grade);
        submission.setFeedback(feedback);
        
        return submissionRepository.save(submission);
    }
}
