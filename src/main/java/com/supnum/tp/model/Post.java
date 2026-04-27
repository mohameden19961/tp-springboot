package com.supnum.tp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String content;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "author_id")
    @JsonIgnoreProperties({"enrolledCourses", "taughtCourses"})
    private User author;

    @ManyToOne
    @JoinColumn(name = "course_id")
    @JsonIgnoreProperties({"enrolledUsers", "teacher"})
    private Course course;

    @PrePersist
    public void setCreationDate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }

    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }
}
