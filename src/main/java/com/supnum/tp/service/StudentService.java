package com.supnum.tp.service;

import com.supnum.tp.dto.StudentDTO;
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
public class StudentService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CourseRepository courseRepository;

    public List<Student> getAll() {
        String email = getCurrentUserEmail();
        if (isAdmin()) {
            return studentRepository.findAll();
        }
        return studentRepository.findByCreatedBy(email);
    }

    public Student create(StudentDTO dto) {
        Student student = new Student();
        student.setName(dto.getName());
        student.setEmail(dto.getEmail());
        student.setCreatedBy(getCurrentUserEmail());
        return studentRepository.save(student);
    }

    public Student getById(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
        checkOwnership(student);
        return student;
    }

    public void delete(Long id) {
        if (!isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Seul l'administrateur peut supprimer");
        }
        studentRepository.deleteById(id);
    }

    public Student update(Long id, StudentDTO dto) {
        Student existing = studentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
        checkOwnership(existing);
        existing.setName(dto.getName());
        existing.setEmail(dto.getEmail());
        return studentRepository.save(existing);
    }

    public List<Student> search(String name) {
        if (isAdmin()) {
            return studentRepository.findByName(name);
        }
        return studentRepository.findByNameAndCreatedBy(name, getCurrentUserEmail());
    }

    public Page<Student> getAllPaged(Pageable pageable) {
        if (isAdmin()) {
            return studentRepository.findAll(pageable);
        }
        return studentRepository.findByCreatedBy(getCurrentUserEmail(), pageable);
    }

    public Student inscrire(Long studentId, Long courseId) {
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

    // Security helpers
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
}
