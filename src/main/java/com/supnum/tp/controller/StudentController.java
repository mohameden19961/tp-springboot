package com.supnum.tp.controller;

import com.supnum.tp.dto.StudentDTO;
import com.supnum.tp.model.Student;
import com.supnum.tp.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/students")
public class StudentController {

    @Autowired
    private StudentService studentService;

    @GetMapping
    public List<Student> getAll() {
        return studentService.getAll();
    }

    @PostMapping
    public Student create(@RequestBody StudentDTO dto) {
        return studentService.create(dto);
    }

    @GetMapping("/{id}")
    public Student getById(@PathVariable @NonNull Long id) {
        return studentService.getById(id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable @NonNull Long id) {
        studentService.delete(id);
    }

    @PutMapping("/{id}")
    public Student update(@PathVariable @NonNull Long id, @RequestBody StudentDTO dto) {
        return studentService.update(id, dto);
    }

    @GetMapping("/search")
    public List<Student> search(@RequestParam String name) {
        return studentService.search(name);
    }

    @GetMapping("/page")
    public Page<Student> getAllPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return studentService.getAllPaged(PageRequest.of(page, size));
    }

    @PostMapping("/{studentId}/courses/{courseId}")
    public Student inscrire(@PathVariable @NonNull Long studentId, @PathVariable @NonNull Long courseId) {
        return studentService.inscrire(studentId, courseId);
    }
}
