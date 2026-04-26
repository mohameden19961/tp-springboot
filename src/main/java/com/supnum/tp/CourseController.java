package com.supnum.tp;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/courses")

public class CourseController {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private StudentRepository studentRepository;

    @GetMapping
    public List<Course> getAll() {
        String email = getCurrentUserEmail();
        if (isAdmin()) {
            return courseRepository.findAll();
        }
        return courseRepository.findByCreatedBy(email);
    }

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

    @PostMapping
    public Course create(@RequestBody CourseDTO dto) {
        Course course = new Course();
        course.setTitle(dto.getTitle());
        course.setCreatedBy(getCurrentUserEmail());
        return courseRepository.save(course);
    }

    @GetMapping("/{id}")
    public Course getById(@PathVariable @NonNull Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        checkOwnership(course);
        return course;
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable @NonNull Long id) {
        if (!isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Seul l'administrateur peut supprimer");
        }
        courseRepository.deleteById(id);
    }

    @PutMapping("/{id}")
    public Course update(@PathVariable @NonNull Long id, @RequestBody CourseDTO dto) {
        Course existing = courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        checkOwnership(existing);
        existing.setTitle(dto.getTitle());
        return courseRepository.save(existing);
    }

    @GetMapping("/search")
    public List<Course> search(@RequestParam String title) {
        if (isAdmin()) {
            return courseRepository.findByTitle(title);
        }
        return courseRepository.findByTitleAndCreatedBy(title, getCurrentUserEmail());
    }

    @GetMapping("/page")
    public Page<Course> getAllPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        if (isAdmin()) {
            return courseRepository.findAll(PageRequest.of(page, size));
        }
        return courseRepository.findByCreatedBy(getCurrentUserEmail(), PageRequest.of(page, size));
    }

    @GetMapping("/{id}/students")
    public List<Student> getStudentsByCourse(@PathVariable @NonNull Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        checkOwnership(course);
        return studentRepository.findByCourses_Id(id);
    }
}
