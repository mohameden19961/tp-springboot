package com.project.repository;

import com.project.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.*;
import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByTitle(String title);
    Page<Course> findAll(Pageable pageable);
}
