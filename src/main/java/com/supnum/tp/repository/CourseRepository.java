package com.supnum.tp.repository;

import com.supnum.tp.model.Course;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByTitle(String title);
    Page<Course> findAll(Pageable pageable);
    List<Course> findByCreatedBy(String email);
    Page<Course> findByCreatedBy(String email, Pageable pageable);
    List<Course> findByTitleAndCreatedBy(String title, String email);
}
