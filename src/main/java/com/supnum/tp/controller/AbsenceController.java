package com.supnum.tp.controller;

import com.supnum.tp.model.Absence;
import com.supnum.tp.model.Course;
import com.supnum.tp.model.User;
import com.supnum.tp.repository.AbsenceRepository;
import com.supnum.tp.repository.CourseRepository;
import com.supnum.tp.repository.UserRepository;
import com.supnum.tp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@RestController
@RequestMapping("/courses/{courseId}/absences")
@Transactional
public class AbsenceController {

    @Autowired private AbsenceRepository absenceRepository;
    @Autowired private com.supnum.tp.service.CourseService courseService;
    @Autowired private CourseRepository courseRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private UserService userService;
    @Autowired private SimpMessagingTemplate messagingTemplate;

    private void verifyAccess(Course course) {
        User currentUser = userService.getCurrentUser();
        if (!course.getTeacher().getId().equals(currentUser.getId()) && !"ADMIN".equals(currentUser.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Seul le professeur peut gérer les absences");
        }
    }

    @GetMapping
    public List<Absence> getAbsences(@PathVariable Long courseId, @RequestParam(required = false) Long studentId) {
        Course course = courseService.getById(courseId);
        User currentUser = userService.getCurrentUser();
        
        // Un étudiant a le droit de voir ses propres absences, le prof/admin voit tout
        if (studentId != null && studentId.equals(currentUser.getId())) {
             return absenceRepository.findByCourseAndStudentOrderByIdDesc(course, currentUser);
        } else {
             verifyAccess(course);
        }

        if (studentId != null) {
            User student = userRepository.findById(studentId).orElseThrow();
            return absenceRepository.findByCourseAndStudentOrderByIdDesc(course, student);
        }
        return absenceRepository.findByCourseOrderByIdDesc(course);
    }

    @PostMapping
    public Absence markAbsence(@PathVariable Long courseId, @RequestBody Absence absenceReq) {
        Course course = courseRepository.findById(courseId).orElseThrow();
        verifyAccess(course);
        
        if (absenceReq.getStudent() == null || absenceReq.getStudent().getId() == null) {
             throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'étudiant est requis");
        }
        
        User student = userRepository.findById(absenceReq.getStudent().getId()).orElseThrow();
        
        Absence absence = new Absence();
        absence.setCourse(course);
        absence.setStudent(student);
        absence.setDate(absenceReq.getDate());
        absence.setReason(absenceReq.getReason());
        absence.setJustified(absenceReq.isJustified());
        
        Absence saved = absenceRepository.save(absence);
        messagingTemplate.convertAndSend("/topic/updates/" + courseId, "REFRESH_DATA");
        return saved;
    }

    @DeleteMapping("/{absenceId}")
    public void removeAbsence(@PathVariable Long courseId, @PathVariable Long absenceId) {
        Course course = courseRepository.findById(courseId).orElseThrow();
        verifyAccess(course);
        absenceRepository.deleteById(absenceId);
        messagingTemplate.convertAndSend("/topic/updates/" + courseId, "REFRESH_DATA");
    }
}
