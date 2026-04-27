package com.supnum.tp.repository;

import com.supnum.tp.model.Course;
import com.supnum.tp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long> {
    Optional<Course> findByJoinCode(String joinCode);
    List<Course> findByTeacher(User teacher);
    List<Course> findByEnrolledUsers(User student);
}
