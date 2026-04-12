package com.supnum.tp.repository;

import com.supnum.tp.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.*;
import java.util.List;

public interface StudentRepository extends JpaRepository<Student, Long> {
    List<Student> findByName(String name);
    Page<Student> findAll(Pageable pageable);
    List<Student> findByCourses_Id(Long courseId);
}
