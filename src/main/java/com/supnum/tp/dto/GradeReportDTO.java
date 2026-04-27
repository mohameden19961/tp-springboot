package com.supnum.tp.dto;

import java.util.List;
import java.util.Map;

public class GradeReportDTO {
    private List<StudentGrades> students;
    private List<String> quizTitles;
    private List<String> assignmentTitles;

    public static class StudentGrades {
        private String name;
        private Map<String, Double> quizScores; // Quiz Title -> Score (percentage or raw)
        private Map<String, Double> assignmentGrades; // Assignment Title -> Grade

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public Map<String, Double> getQuizScores() { return quizScores; }
        public void setQuizScores(Map<String, Double> quizScores) { this.quizScores = quizScores; }
        public Map<String, Double> getAssignmentGrades() { return assignmentGrades; }
        public void setAssignmentGrades(Map<String, Double> assignmentGrades) { this.assignmentGrades = assignmentGrades; }
    }

    public List<StudentGrades> getStudents() { return students; }
    public void setStudents(List<StudentGrades> students) { this.students = students; }
    public List<String> getQuizTitles() { return quizTitles; }
    public void setQuizTitles(List<String> quizTitles) { this.quizTitles = quizTitles; }
    public List<String> getAssignmentTitles() { return assignmentTitles; }
    public void setAssignmentTitles(List<String> assignmentTitles) { this.assignmentTitles = assignmentTitles; }
}
