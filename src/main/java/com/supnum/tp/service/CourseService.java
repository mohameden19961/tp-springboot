package com.supnum.tp.service;

import com.supnum.tp.dto.CourseDTO;
import com.supnum.tp.model.Course;
import com.supnum.tp.model.Student;
import com.supnum.tp.repository.CourseRepository;
import com.supnum.tp.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CourseService {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private StudentRepository studentRepository;

    public List<Course> getAll() {
        String email = getCurrentUserEmail();
        if (isAdmin()) {
            return courseRepository.findAll();
        }
        return courseRepository.findByCreatedBy(email);
    }

    public Course create(CourseDTO dto) {
        Course course = new Course();
        course.setTitle(dto.getTitle());
        course.setCreatedBy(getCurrentUserEmail());
        return courseRepository.save(course);
    }

    public Course getById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        checkOwnership(course);
        return course;
    }

    public void delete(Long id) {
        if (!isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Seul l'administrateur peut supprimer");
        }
        courseRepository.deleteById(id);
    }

    public Course update(Long id, CourseDTO dto) {
        Course existing = courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        checkOwnership(existing);
        existing.setTitle(dto.getTitle());
        return courseRepository.save(existing);
    }

    public List<Course> search(String title) {
        if (isAdmin()) {
            return courseRepository.findByTitle(title);
        }
        return courseRepository.findByTitleAndCreatedBy(title, getCurrentUserEmail());
    }

    public Page<Course> getAllPaged(Pageable pageable) {
        if (isAdmin()) {
            return courseRepository.findAll(pageable);
        }
        return courseRepository.findByCreatedBy(getCurrentUserEmail(), pageable);
    }

    public List<Student> getStudentsByCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        checkOwnership(course);
        return studentRepository.findByCourses_Id(id);
    }

    // Security helpers
    private String getCurrentUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (String) auth.getPrincipal();
    }

    private boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
    }

    private void checkOwnership(Course course) {
        if (!isAdmin() && !course.getCreatedBy().equals(getCurrentUserEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous n'avez pas accès à ce cours");
        }
    }
}
