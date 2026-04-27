package com.supnum.tp.model;

import jakarta.persistence.*;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "question")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String text;

    @ElementCollection
    private List<String> options;

    private String type = "RADIO"; // RADIO, CHECKBOX, TEXT

    @ElementCollection
    private List<Integer> correctAnswers;

    private String correctText;

    private Integer points = 0; // Points pour cette question (Total doit être 20)

    @ManyToOne
    @JoinColumn(name = "quiz_id", nullable = false)
    @JsonIgnore
    private Quiz quiz;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public List<String> getOptions() { return options; }
    public void setOptions(List<String> options) { this.options = options; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public List<Integer> getCorrectAnswers() { return correctAnswers; }
    public void setCorrectAnswers(List<Integer> correctAnswers) { this.correctAnswers = correctAnswers; }

    public String getCorrectText() { return correctText; }
    public void setCorrectText(String correctText) { this.correctText = correctText; }

    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }

    public Quiz getQuiz() { return quiz; }
    public void setQuiz(Quiz quiz) { this.quiz = quiz; }
}
