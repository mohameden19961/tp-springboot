package com.supnum.tp.repository;

import com.supnum.tp.model.ChatMessage;
import com.supnum.tp.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByCourseOrderByTimestampAsc(Course course);
}
