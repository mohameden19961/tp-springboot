package com.supnum.tp.repository;

import com.supnum.tp.model.Absence;
import com.supnum.tp.model.Course;
import com.supnum.tp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AbsenceRepository extends JpaRepository<Absence, Long> {
    List<Absence> findByCourseOrderByIdDesc(Course course);
    List<Absence> findByCourseAndStudentOrderByIdDesc(Course course, User student);
}
