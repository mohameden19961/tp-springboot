package com.supnum.tp;
// Classe DTO (Data Transfer Object) pour représenter 
// les données d'un étudiant lors de la création ou de la mise à jour
public class StudentDTO {
    private String name;
    private String email;

    public String getName() { 
        return name; 
    }
    public void setName(String name) { 
        this.name = name;
    }

    public String getEmail() {
         return email; 
    }
    public void setEmail(String email) { 
        this.email = email;
    }
}
