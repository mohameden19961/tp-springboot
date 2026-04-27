package com.supnum.tp.service;

import com.supnum.tp.dto.CourseDTO;
import com.supnum.tp.model.Course;
import com.supnum.tp.model.EnrollmentRequest;
import com.supnum.tp.model.Room;
import com.supnum.tp.model.User;
import com.supnum.tp.repository.CourseRepository;
import com.supnum.tp.repository.EnrollmentRequestRepository;
import com.supnum.tp.repository.RoomRepository;
import com.supnum.tp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.ArrayList;

@Service
public class CourseService {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserService userService;
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private EnrollmentRequestRepository requestRepository;

    public List<Course> getMyCourses() {
        User currentUser = userService.getCurrentUser();
        if ("ADMIN".equals(currentUser.getRole())) {
            return courseRepository.findAll();
        }
        if ("TEACHER".equals(currentUser.getRole())) {
            List<Course> courses = courseRepository.findByTeacher(currentUser);
            courses.addAll(courseRepository.findByEnrolledUsers(currentUser));
            // Ajouter aussi les cours où le prof est étudiant et accepté
            List<EnrollmentRequest> acceptedRequests = requestRepository.findByStudent(currentUser).stream()
                .filter(r -> "ACCEPTED".equals(r.getStatus())).toList();
            acceptedRequests.forEach(r -> courses.add(r.getCourse()));
            return courses.stream().distinct().toList();
        }
        
        // Pour un étudiant : Voir les cours où il est inscrit OU accepté
        List<Course> studentCourses = new java.util.ArrayList<>(courseRepository.findByEnrolledUsers(currentUser));
        List<EnrollmentRequest> accepted = requestRepository.findByStudent(currentUser).stream()
            .filter(r -> "ACCEPTED".equals(r.getStatus())).toList();
        accepted.forEach(r -> {
            if (!studentCourses.contains(r.getCourse())) studentCourses.add(r.getCourse());
        });
        return studentCourses;
    }

    public Course create(CourseDTO dto) {
        User currentUser = userService.getCurrentUser();
        if (!"TEACHER".equals(currentUser.getRole()) && !"ADMIN".equals(currentUser.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Seuls les enseignants peuvent créer un cours.");
        }
        
        Course course = new Course();
        course.setTitle(dto.getTitle());
        course.setDescription(dto.getDescription());
        course.setSemester(dto.getSemester());
        course.setTeacher(currentUser);
        course.setDayOfWeek(dto.getDayOfWeek());
        course.setStartTime(dto.getStartTime());
        course.setEndTime(dto.getEndTime());

        if (dto.getRoomId() != null) {
            Room room = roomRepository.findById(dto.getRoomId()).orElse(null);
            course.setRoom(room);
        }
        
        return courseRepository.save(course);
    }

    public Course getById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        
        // Resynchroniser les utilisateurs inscrits avec les demandes acceptées
        java.util.List<EnrollmentRequest> acceptedReqs = requestRepository.findByCourseOrderByIdDesc(course).stream()
                .filter(r -> "ACCEPTED".equals(r.getStatus())).toList();
        boolean changed = false;
        for (EnrollmentRequest req : acceptedReqs) {
            User s = req.getStudent();
            if (course.getEnrolledUsers().stream().noneMatch(u -> u.getId().equals(s.getId()))) {
                course.getEnrolledUsers().add(s);
                s.getEnrolledCourses().add(course);
                userRepository.save(s);
                changed = true;
            }
        }
        if (changed) {
            courseRepository.save(course);
        }

        User currentUser = userService.getCurrentUser();
        
        if ("ADMIN".equals(currentUser.getRole())) return course;

        // Vérification robuste : EnrolledUsers OU EnrollmentRequest ACCEPTED
        boolean isEnrolled = course.getEnrolledUsers().stream()
                .anyMatch(u -> u.getId().equals(currentUser.getId()));
        
        if (!isEnrolled) {
            isEnrolled = requestRepository.findByStudentAndCourse(currentUser, course)
                .map(r -> "ACCEPTED".equals(r.getStatus()))
                .orElse(false);
        }
        
        if (!course.getTeacher().getId().equals(currentUser.getId()) && !isEnrolled) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous n'avez pas accès à ce cours.");
        }
        return course;
    }

    public EnrollmentRequest joinCourse(String joinCode) {
        User currentUser = userService.getCurrentUser();
        Course course = courseRepository.findByJoinCode(joinCode.toUpperCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Code de cours invalide"));
        
        if (course.getEnrolledUsers().contains(currentUser)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vous êtes déjà inscrit à ce cours.");
        }

        return requestRepository.findByStudentAndCourse(currentUser, course)
                .orElseGet(() -> {
                    EnrollmentRequest req = new EnrollmentRequest();
                    req.setStudent(currentUser);
                    req.setCourse(course);
                    return requestRepository.save(req);
                });
    }

    public List<EnrollmentRequest> getRequestsForCourse(Long courseId) {
        Course course = getById(courseId); 
        User currentUser = userService.getCurrentUser();
        if (!"ADMIN".equals(currentUser.getRole()) && !course.getTeacher().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé.");
        }
        return requestRepository.findByCourseOrderByIdDesc(course);
    }

    public EnrollmentRequest respondToRequest(Long courseId, Long requestId, boolean accept) {
        User currentUser = userService.getCurrentUser();
        Course course = getById(courseId);
        
        if (!"ADMIN".equals(currentUser.getRole()) && !course.getTeacher().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Seul l'administration ou le professeur peuvent accepter un étudiant.");
        }
        
        EnrollmentRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Demande introuvable"));
                
        if (!req.getCourse().getId().equals(courseId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Incohérence des identifiants");
        }

        req.setStatus(accept ? "ACCEPTED" : "REJECTED");
        requestRepository.save(req);

        if (accept) {
            User student = req.getStudent();
            if (!course.getEnrolledUsers().contains(student)) {
                course.getEnrolledUsers().add(student);
                courseRepository.save(course);
                student.getEnrolledCourses().add(course);
                userRepository.save(student);
            }
        }
        
        return req;
    }

    @Transactional
    public void delete(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        
        User currentUser = userService.getCurrentUser();
        if (!course.getTeacher().getId().equals(currentUser.getId()) && !"ADMIN".equals(currentUser.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Seuls le créateur ou l'admin peuvent supprimer.");
        }
        
        List<User> students = new ArrayList<>(course.getEnrolledUsers());
        for (User student : students) {
            student.getEnrolledCourses().remove(course);
            userRepository.save(student);
        }
        course.getEnrolledUsers().clear();
        courseRepository.saveAndFlush(course);
        
        courseRepository.delete(course);
    }
}
