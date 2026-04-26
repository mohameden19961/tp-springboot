package com.supnum.tp;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface StudentRepository extends JpaRepository<Student, Long> {
    List<Student> findByName(String name);
    Page<Student> findAll(Pageable pageable);
    List<Student> findByCourses_Id(Long courseId);
    List<Student> findByCreatedBy(String email);
    Page<Student> findByCreatedBy(String email, Pageable pageable);
    List<Student> findByNameAndCreatedBy(String name, String email);
}
