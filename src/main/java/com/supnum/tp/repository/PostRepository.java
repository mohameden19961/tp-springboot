package com.supnum.tp.repository;

import com.supnum.tp.model.Post;
import com.supnum.tp.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByCourseOrderByCreatedAtDesc(Course course);
}
