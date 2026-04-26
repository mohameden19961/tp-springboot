package com.supnum.tp;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    
    private String createdBy;

    public Long getId() { 
        return id;
    }

    public void setId(Long id) {
         this.id = id; 
    }

    public String getTitle() { 
        return title;
    }
    
    public void setTitle(String title) { 
        this.title = title; 
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
}
