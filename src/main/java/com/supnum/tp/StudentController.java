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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/students")
public class StudentController {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @GetMapping
    public List<Student> getAll() {
        String email = getCurrentUserEmail();
        if (isAdmin()) {
            return studentRepository.findAll();
        }
        return studentRepository.findByCreatedBy(email);
    }

    private String getCurrentUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (String) auth.getPrincipal();
    }

    private boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
    }

    private void checkOwnership(Student student) {
        if (!isAdmin() && !student.getCreatedBy().equals(getCurrentUserEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous n'avez pas accès à cet étudiant");
        }
    }

    private void checkOwnershipCourse(Course course) {
        if (!isAdmin() && !course.getCreatedBy().equals(getCurrentUserEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous n'avez pas accès à ce cours");
        }
    }

    @PostMapping
    public Student create(@RequestBody StudentDTO dto) {
        Student student = new Student();
        student.setName(dto.getName());
        student.setEmail(dto.getEmail());
        student.setCreatedBy(getCurrentUserEmail());
        return studentRepository.save(student);
    }

    @GetMapping("/{id}")
    public Student getById(@PathVariable @NonNull Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
        checkOwnership(student);
        return student;
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable @NonNull Long id) {
        if (!isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Seul l'administrateur peut supprimer");
        }
        studentRepository.deleteById(id);
    }

    @PutMapping("/{id}")
    public Student update(@PathVariable @NonNull Long id, @RequestBody StudentDTO dto) {
        Student existing = studentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
        checkOwnership(existing);
        existing.setName(dto.getName());
        existing.setEmail(dto.getEmail());
        return studentRepository.save(existing);
    }

    @GetMapping("/search")
    public List<Student> search(@RequestParam String name) {
        if (isAdmin()) {
            return studentRepository.findByName(name);
        }
        return studentRepository.findByNameAndCreatedBy(name, getCurrentUserEmail());
    }

    @GetMapping("/page")
    public Page<Student> getAllPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        if (isAdmin()) {
            return studentRepository.findAll(PageRequest.of(page, size));
        }
        return studentRepository.findByCreatedBy(getCurrentUserEmail(), PageRequest.of(page, size));
    }

    @PostMapping("/{studentId}/courses/{courseId}")
    public Student inscrire(@PathVariable @NonNull Long studentId, @PathVariable @NonNull Long courseId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
        checkOwnership(student);
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        checkOwnershipCourse(course);
        if (student.getCourses().contains(course)) {
            throw new RuntimeException("Etudiant deja inscrit dans ce cours");
        }
        student.getCourses().add(course);
        return studentRepository.save(student);
    }
}
