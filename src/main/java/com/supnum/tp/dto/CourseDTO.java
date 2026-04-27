package com.supnum.tp.dto;

public class CourseDTO {
    private String title;
    private String description;
    private String semester;   // ex: "S1" à "S5"
    private Long roomId;       // ID de la salle choisie (optionnel)
    private String dayOfWeek;  // ex: "LUNDI", "MARDI"
    private String startTime;  // ex: "08:00"
    private String endTime;    // ex: "10:00"

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }

    public Long getRoomId() { return roomId; }
    public void setRoomId(Long roomId) { this.roomId = roomId; }

    public String getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(String dayOfWeek) { this.dayOfWeek = dayOfWeek; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
}

