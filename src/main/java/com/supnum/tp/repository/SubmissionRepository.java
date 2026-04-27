package com.supnum.tp.repository;

import com.supnum.tp.model.Assignment;
import com.supnum.tp.model.Submission;
import com.supnum.tp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByAssignmentOrderByIdDesc(Assignment assignment);
    java.util.List<Submission> findByAssignmentAndStudentOrderByIdDesc(Assignment assignment, User student);
}
