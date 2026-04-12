package com.supnum.tp.controller;

import com.supnum.tp.dto.request.CourseDTO;
import com.supnum.tp.entity.Course;
import com.supnum.tp.entity.Student;
import com.supnum.tp.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/courses")
public class CourseController {

    @Autowired private CourseService courseService;

    @GetMapping
    public List<Course> getAll() { return courseService.getAll(); }

    @PostMapping
    public Course create(@RequestBody CourseDTO dto) { return courseService.create(dto); }

    @GetMapping("/{id}")
    public Course getById(@PathVariable @NonNull Long id) { return courseService.getById(id); }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable @NonNull Long id) { courseService.delete(id); }

    @PutMapping("/{id}")
    public Course update(@PathVariable @NonNull Long id, @RequestBody CourseDTO dto) {
        return courseService.update(id, dto);
    }

    @GetMapping("/search")
    public List<Course> search(@RequestParam String title) { return courseService.search(title); }

    @GetMapping("/page")
    public Page<Course> getAllPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return courseService.getAllPaged(page, size);
    }

    @GetMapping("/{id}/students")
    public List<Student> getStudentsByCourse(@PathVariable @NonNull Long id) {
        return courseService.getStudentsByCourse(id);
    }
}
