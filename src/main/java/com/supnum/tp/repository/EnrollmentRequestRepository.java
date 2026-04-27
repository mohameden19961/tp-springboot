package com.supnum.tp.repository;

import com.supnum.tp.model.Course;
import com.supnum.tp.model.EnrollmentRequest;
import com.supnum.tp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRequestRepository extends JpaRepository<EnrollmentRequest, Long> {
    List<EnrollmentRequest> findByCourseOrderByIdDesc(Course course);
    Optional<EnrollmentRequest> findByStudentAndCourse(User student, Course course);
    List<EnrollmentRequest> findByStudent(User student);
}
