package com.project.service;

import com.project.dto.request.StudentDTO;
import com.project.entity.Course;
import com.project.entity.Student;
import com.project.repository.CourseRepository;
import com.project.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class StudentService {

    @Autowired private StudentRepository studentRepository;
    @Autowired private CourseRepository courseRepository;

    public List<Student> getAll() { return studentRepository.findAll(); }

    public Student create(StudentDTO dto) {
        Student student = new Student();
        student.setName(dto.getName());
        student.setEmail(dto.getEmail());
        return studentRepository.save(student);
    }

    public Student getById(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
    }

    public void delete(Long id) { studentRepository.deleteById(id); }

    public Student update(Long id, StudentDTO dto) {
        Student existing = getById(id);
        existing.setName(dto.getName());
        existing.setEmail(dto.getEmail());
        return studentRepository.save(existing);
    }

    public List<Student> search(String name) { return studentRepository.findByName(name); }

    public Page<Student> getAllPaged(int page, int size) {
        return studentRepository.findAll(PageRequest.of(page, size));
    }

    public Student inscrire(Long studentId, Long courseId) {
        Student student = getById(studentId);
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        if (student.getCourses().contains(course)) {
            throw new RuntimeException("Etudiant deja inscrit dans ce cours");
        }
        student.getCourses().add(course);
        return studentRepository.save(student);
    }
}
