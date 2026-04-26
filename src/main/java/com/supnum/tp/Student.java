package com.supnum.tp;

import java.util.List;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.JoinTable;
import jakarta.persistence.JoinColumn;


//Entity représentant un étudiant avec des champs de validation et une relation avec les cours
// L'annotation @Entity indique que cette classe est une entité JPA,
//  ce qui signifie qu'elle sera mappée à une table de base de données.

@Entity
public class Student {
    // L'annotation @Id indique que le champ id est la clé primaire de l'entité.
    // L'annotation @GeneratedValue avec la stratégie IDENTITY indique que la valeur 
    // de l'id sera générée automatiquement par la base de données lors de l'insertion d'un nouvel enregistrement
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Size(min = 2, max = 50)
    private String name;

    @Email
    private String email;

    // @OneToMany
    // La relation entre Student et Course est définie comme ManyToMany,
    // ce qui signifie qu'un étudiant peut être inscrit à plusieurs cours et qu'un cours
    //  peut avoir plusieurs étudiants inscrits.
    @ManyToMany
    @JoinTable(
        name = "inscription",
        joinColumns = @JoinColumn(name = "student_id"),
        inverseJoinColumns = @JoinColumn(name = "course_id")
    )
    private List<Course> courses;
    
    private String createdBy;

    public Long getId() { 
        return id; 
    }
    public void setId(Long id) {
         this.id = id; 
    }

    public String getName() { 
        return name; 
    }
    public void setName(String name) { 
        this.name = name; 
    }

    public String getEmail() {
         return email; 
    }

    // La méthode setEmail permet de définir l'adresse e-mail de l'étudiant.
    public void setEmail(String email) { 
        this.email = email;
    }

    // La méthode getCourses retourne la liste des cours associés à l'étudiant.
    public List<Course> getCourses() { 
        return courses; 
    }

    // La méthode setCourses permet de définir la liste des cours associés à l'étudiant.
    public void setCourses(List<Course> courses) { 
        this.courses = courses; 
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
}
