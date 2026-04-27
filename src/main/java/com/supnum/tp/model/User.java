package com.supnum.tp.model;

import jakarta.persistence.*;
import java.util.List;
import java.util.ArrayList;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    
    @Column(unique = true)
    private String email;
    
    private String picture;
    
    private String role; // STUDENT, TEACHER, ADMIN

    // Un utilisateur (Étudiant ou prof) peut s'inscrire à plusieurs cours
    @ManyToMany
    @JoinTable(
        name = "enrollment",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "course_id")
    )
    @JsonIgnoreProperties({"enrolledUsers", "teacher"})
    private List<Course> enrolledCourses = new ArrayList<>();

    // Un utilisateur (Professeur) peut créer plusieurs cours
    @OneToMany(mappedBy = "teacher", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Course> taughtCourses = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPicture() { return picture; }
    public void setPicture(String picture) { this.picture = picture; }
    
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public List<Course> getEnrolledCourses() { return enrolledCourses; }
    public void setEnrolledCourses(List<Course> enrolledCourses) { this.enrolledCourses = enrolledCourses; }

    public List<Course> getTaughtCourses() { return taughtCourses; }
    public void setTaughtCourses(List<Course> taughtCourses) { this.taughtCourses = taughtCourses; }
}
