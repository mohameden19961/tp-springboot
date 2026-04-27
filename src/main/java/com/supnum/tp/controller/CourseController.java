package com.supnum.tp.controller;

import com.supnum.tp.dto.CourseDTO;
import com.supnum.tp.model.Course;
import com.supnum.tp.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@RestController
@RequestMapping("/courses")
@Transactional
public class CourseController {

    @Autowired private CourseService courseService;
    @Autowired private com.supnum.tp.repository.CourseRepository courseRepository;
    @Autowired private com.supnum.tp.repository.QuizRepository quizRepository;
    @Autowired private com.supnum.tp.repository.QuizResultRepository quizResultRepository;
    @Autowired private com.supnum.tp.repository.AssignmentRepository assignmentRepository;
    @Autowired private com.supnum.tp.repository.SubmissionRepository submissionRepository;

    @Transactional(readOnly = true)
    @GetMapping("/{id}/grades")
    public com.supnum.tp.dto.GradeReportDTO getGradeReport(@PathVariable Long id) {
        System.out.println(">>> Fetching grades for course ID: " + id);
        com.supnum.tp.model.Course course = courseRepository.findById(id).orElseThrow();
        com.supnum.tp.dto.GradeReportDTO report = new com.supnum.tp.dto.GradeReportDTO();
        
        java.util.List<com.supnum.tp.model.Quiz> quizzes = quizRepository.findByCourseOrderByIdDesc(course);
        java.util.List<com.supnum.tp.model.Assignment> assignments = assignmentRepository.findByCourseOrderByIdDesc(course);
        
        report.setQuizTitles(quizzes.stream().map(com.supnum.tp.model.Quiz::getTitle).toList());
        report.setAssignmentTitles(assignments.stream().map(com.supnum.tp.model.Assignment::getTitle).toList());
        
        java.util.List<com.supnum.tp.dto.GradeReportDTO.StudentGrades> studentGradesList = new java.util.ArrayList<>();
        
        System.out.println(">>> Students found: " + course.getEnrolledUsers().size());
        for (com.supnum.tp.model.User student : course.getEnrolledUsers()) {
            com.supnum.tp.dto.GradeReportDTO.StudentGrades sg = new com.supnum.tp.dto.GradeReportDTO.StudentGrades();
            sg.setName(student.getName());
            
            java.util.Map<String, Double> quizScores = new java.util.HashMap<>();
            for (com.supnum.tp.model.Quiz q : quizzes) {
                quizResultRepository.findByQuizAndStudentOrderByIdDesc(q, student).stream().findFirst().ifPresent(res -> {
                    // Le score est déjà en points sur 20, on le stocke directement
                    quizScores.put(q.getTitle(), (double) (res.getScore() != null ? res.getScore() : 0));
                });
            }
            sg.setQuizScores(quizScores);
            
            java.util.Map<String, Double> assignGrades = new java.util.HashMap<>();
            for (com.supnum.tp.model.Assignment a : assignments) {
                submissionRepository.findByAssignmentAndStudentOrderByIdDesc(a, student).stream().findFirst().ifPresent(sub -> {
                    if (sub.getGrade() != null) {
                        assignGrades.put(a.getTitle(), sub.getGrade());
                    }
                });
            }
            sg.setAssignmentGrades(assignGrades);
            studentGradesList.add(sg);
        }
        report.setStudents(studentGradesList);
        System.out.println(">>> Report generated successfully for course: " + id);
        return report;
    }

    @GetMapping
    public List<Course> getMyCourses() {
        return courseService.getMyCourses();
    }

    @PostMapping
    public Course create(@RequestBody CourseDTO dto) {
        return courseService.create(dto);
    }

    @PostMapping("/join")
    public com.supnum.tp.model.EnrollmentRequest joinCourse(@RequestParam String code) {
        return courseService.joinCourse(code);
    }

    @GetMapping("/{id}")
    public Course getById(@PathVariable Long id) {
        return courseService.getById(id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        courseService.delete(id);
    }

    @GetMapping("/{id}/requests")
    public List<com.supnum.tp.model.EnrollmentRequest> getRequests(@PathVariable Long id) {
        return courseService.getRequestsForCourse(id);
    }

    @PostMapping("/{id}/requests/{reqId}/accept")
    public com.supnum.tp.model.EnrollmentRequest acceptRequest(@PathVariable Long id, @PathVariable Long reqId) {
        return courseService.respondToRequest(id, reqId, true);
    }

    @PostMapping("/{id}/requests/{reqId}/reject")
    public com.supnum.tp.model.EnrollmentRequest rejectRequest(@PathVariable Long id, @PathVariable Long reqId) {
        return courseService.respondToRequest(id, reqId, false);
    }
}
