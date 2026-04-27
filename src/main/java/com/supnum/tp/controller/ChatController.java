package com.supnum.tp.controller;

import com.supnum.tp.model.ChatMessage;
import com.supnum.tp.model.Course;
import com.supnum.tp.repository.ChatMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
public class ChatController {

    @Autowired private ChatMessageRepository chatMessageRepository;
    @Autowired private com.supnum.tp.service.CourseService courseService;
    @Autowired private com.supnum.tp.repository.CourseRepository courseRepository;

    @GetMapping("/courses/{courseId}/messages")
    public List<ChatMessage> getHistory(@PathVariable Long courseId) {
        Course course = courseService.getById(courseId);
        return chatMessageRepository.findByCourseOrderByTimestampAsc(course);
    }

    @MessageMapping("/chat/{courseId}")
    @SendTo("/topic/messages/{courseId}")
    public ChatMessage sendMessage(@DestinationVariable Long courseId, ChatMessage message) {
        Course course = courseRepository.findById(courseId).orElseThrow();
        // Since WebSockets don't easily share the user context without extra setup, 
        // we'll expect the message to have the sender ID or we can try to get it.
        // For simplicity in this demo, we assume the client sends the sender info.
        
        message.setCourse(course);
        message.setTimestamp(LocalDateTime.now());
        return chatMessageRepository.save(message);
    }
}
