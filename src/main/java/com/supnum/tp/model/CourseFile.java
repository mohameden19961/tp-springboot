package com.supnum.tp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "course_file")
public class CourseFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title; // ex: "Syllabus", "TP 1"

    @Column(nullable = false, length = 1000)
    private String url; // ex: "https://drive.google.com/..." or filename for local files

    private boolean isLocal = false;

    private LocalDateTime addedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    @JsonIgnoreProperties({"enrolledUsers", "teacher", "hibernateLazyInitializer", "handler"})
    private Course course;

    @PrePersist
    public void setDate() {
        if (addedAt == null) {
            addedAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public boolean isLocal() { return isLocal; }
    public void setLocal(boolean local) { isLocal = local; }

    public LocalDateTime getAddedAt() { return addedAt; }
    public void setAddedAt(LocalDateTime addedAt) { this.addedAt = addedAt; }

    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }
}
