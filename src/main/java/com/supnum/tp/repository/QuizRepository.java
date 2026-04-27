package com.supnum.tp.repository;

import com.supnum.tp.model.Quiz;
import com.supnum.tp.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByCourseOrderByIdDesc(Course course);
}
