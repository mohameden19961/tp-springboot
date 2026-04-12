package com.supnum.tp.service;

import com.supnum.tp.dto.request.CourseDTO;
import com.supnum.tp.entity.Course;
import com.supnum.tp.entity.Student;
import com.supnum.tp.repository.CourseRepository;
import com.supnum.tp.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CourseService {

    @Autowired private CourseRepository courseRepository;
    @Autowired private StudentRepository studentRepository;

    public List<Course> getAll() { return courseRepository.findAll(); }

    public Course create(CourseDTO dto) {
        Course course = new Course();
        course.setTitle(dto.getTitle());
        return courseRepository.save(course);
    }

    public Course getById(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
    }

    public void delete(Long id) { courseRepository.deleteById(id); }

    public Course update(Long id, CourseDTO dto) {
        Course existing = getById(id);
        existing.setTitle(dto.getTitle());
        return courseRepository.save(existing);
    }

    public List<Course> search(String title) { return courseRepository.findByTitle(title); }

    public Page<Course> getAllPaged(int page, int size) {
        return courseRepository.findAll(PageRequest.of(page, size));
    }

    public List<Student> getStudentsByCourse(Long id) {
        getById(id);
        return studentRepository.findByCourses_Id(id);
    }
}
