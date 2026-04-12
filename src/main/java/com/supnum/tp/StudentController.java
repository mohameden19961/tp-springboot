package com.supnum.tp;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/students")
@SuppressWarnings("null")
public class StudentController {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @GetMapping
    public List<Student> getAll() {
        return studentRepository.findAll();
    }

    @PostMapping
    public Student create(@RequestBody StudentDTO dto) {
        Student student = new Student();
        student.setName(dto.getName());
        student.setEmail(dto.getEmail());
        return studentRepository.save(student);
    }

    @GetMapping("/{id}")
    public Student getById(@PathVariable @NonNull Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable @NonNull Long id) {
        studentRepository.deleteById(id);
    }

    @PutMapping("/{id}")
    public Student update(@PathVariable @NonNull Long id, @RequestBody StudentDTO dto) {
        Student existing = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        existing.setName(dto.getName());
        existing.setEmail(dto.getEmail());
        return studentRepository.save(existing);
    }

    @GetMapping("/search")
    public List<Student> search(@RequestParam String name) {
        return studentRepository.findByName(name);
    }

    @GetMapping("/page")
    public Page<Student> getAllPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return studentRepository.findAll(PageRequest.of(page, size));
    }

    @PostMapping("/{studentId}/courses/{courseId}")
    public Student inscrire(@PathVariable @NonNull Long studentId, @PathVariable @NonNull Long courseId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        if (student.getCourses().contains(course)) {
            throw new RuntimeException("Etudiant deja inscrit dans ce cours");
        }
        student.getCourses().add(course);
        return studentRepository.save(student);
    }

    @DeleteMapping("/{studentId}/courses/{courseId}")
    public Student desinscrire(@PathVariable @NonNull Long studentId, @PathVariable @NonNull Long courseId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        student.getCourses().remove(course);
        return studentRepository.save(student);
    }
}
