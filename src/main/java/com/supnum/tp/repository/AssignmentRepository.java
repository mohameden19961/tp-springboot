package com.supnum.tp.repository;

import com.supnum.tp.model.Assignment;
import com.supnum.tp.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByCourseOrderByIdDesc(Course course);
}
