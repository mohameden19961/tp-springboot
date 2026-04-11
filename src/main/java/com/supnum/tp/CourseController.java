package com.supnum.tp;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/courses")

public class CourseController {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private StudentRepository studentRepository;

    @GetMapping
    public List<Course> getAll() {
        return courseRepository.findAll();
    }

    @PostMapping
    public Course create(@RequestBody CourseDTO dto) {
        Course course = new Course();
        course.setTitle(dto.getTitle());
        return courseRepository.save(course);
    }

    @GetMapping("/{id}")
    public Course getById(@PathVariable @NonNull Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable @NonNull Long id) {
        courseRepository.deleteById(id);
    }

    @PutMapping("/{id}")
    public Course update(@PathVariable @NonNull Long id, @RequestBody CourseDTO dto) {
        Course existing = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        existing.setTitle(dto.getTitle());
        return courseRepository.save(existing);
    }

    @GetMapping("/search")
    public List<Course> search(@RequestParam String title) {
        return courseRepository.findByTitle(title);
    }

    @GetMapping("/page")
    public Page<Course> getAllPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return courseRepository.findAll(PageRequest.of(page, size));
    }

    @GetMapping("/{id}/students")
    public List<Student> getStudentsByCourse(@PathVariable @NonNull Long id) {
        courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        return studentRepository.findByCourses_Id(id);
    }
}
