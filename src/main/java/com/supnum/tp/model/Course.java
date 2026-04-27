package com.supnum.tp.model;

import jakarta.persistence.*;
import java.util.List;
import java.util.ArrayList;
import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    
    private String description;
    
    @Column(unique = true, updatable = false)
    private String joinCode; // Code secret pour rejoindre le cours (ex: JAVA-A8F2)

    private String semester; // ex: "S1", "S2", ..., "S5"

    private String dayOfWeek;  // ex: "LUNDI", "MARDI", ..., "VENDREDI"
    private String startTime;  // ex: "08:00"
    private String endTime;    // ex: "10:00"

    @ManyToOne
    @JoinColumn(name = "teacher_id")
    @JsonIgnoreProperties({"taughtCourses", "enrolledCourses"})
    private User teacher;

    @ManyToMany(mappedBy = "enrolledCourses")
    @JsonIgnoreProperties({"enrolledCourses", "taughtCourses"})
    private List<User> enrolledUsers = new ArrayList<>();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "room_id")
    private Room room;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("course")
    private List<Post> posts = new ArrayList<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("course")
    private List<CourseFile> files = new ArrayList<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("course")
    private List<Quiz> quizzes = new ArrayList<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("course")
    private List<Assignment> assignments = new ArrayList<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("course")
    private List<Absence> absences = new ArrayList<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("course")
    private List<EnrollmentRequest> enrollmentRequests = new ArrayList<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("course")
    private List<ChatMessage> chatMessages = new ArrayList<>();

    @PrePersist
    public void generateJoinCode() {
        if (this.joinCode == null) {
            String shortId = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            this.joinCode = "MOD-" + shortId;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getJoinCode() { return joinCode; }
    public void setJoinCode(String joinCode) { this.joinCode = joinCode; }

    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }

    public String getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(String dayOfWeek) { this.dayOfWeek = dayOfWeek; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }

    public User getTeacher() { return teacher; }
    public void setTeacher(User teacher) { this.teacher = teacher; }

    public List<User> getEnrolledUsers() { return enrolledUsers; }
    public void setEnrolledUsers(List<User> enrolledUsers) { this.enrolledUsers = enrolledUsers; }

    public Room getRoom() { return room; }
    public void setRoom(Room room) { this.room = room; }

    // Getters for child lists (optional but good practice)
    public List<Post> getPosts() { return posts; }
    public List<CourseFile> getFiles() { return files; }
    public List<Quiz> getQuizzes() { return quizzes; }
    public List<Assignment> getAssignments() { return assignments; }
    public List<Absence> getAbsences() { return absences; }
    public List<EnrollmentRequest> getEnrollmentRequests() { return enrollmentRequests; }
}
