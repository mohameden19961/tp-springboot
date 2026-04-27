package com.supnum.tp.controller;

import com.supnum.tp.model.*;
import com.supnum.tp.repository.*;
import com.supnum.tp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin")
public class AdminController {

    @Autowired private UserRepository userRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private RoomRepository roomRepository;
    @Autowired private AbsenceRepository absenceRepository;
    @Autowired private UserService userService;

    private void requireAdmin() {
        User current = userService.getCurrentUser();
        if (!"ADMIN".equals(current.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès réservé à l'administrateur.");
        }
    }

    /**
     * GET /admin/stats — Tableau de bord institutionnel complet
     */
    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        requireAdmin();

        List<User> allUsers = userRepository.findAll();
        List<Course> allCourses = courseRepository.findAll();
        List<Room> allRooms = roomRepository.findAll();
        List<Absence> allAbsences = absenceRepository.findAll();

        long studentCount = allUsers.stream().filter(u -> "STUDENT".equals(u.getRole())).count();
        long teacherCount = allUsers.stream().filter(u -> "TEACHER".equals(u.getRole())).count();
        long courseCount = allCourses.size();
        long roomCount = allRooms.size();

        // Top cours par nombre d'inscrits
        List<Map<String, Object>> topCourses = allCourses.stream()
                .sorted((a, b) -> b.getEnrolledUsers().size() - a.getEnrolledUsers().size())
                .limit(5)
                .map(c -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", c.getId());
                    m.put("title", c.getTitle());
                    m.put("teacherName", c.getTeacher() != null ? c.getTeacher().getName() : "N/A");
                    m.put("enrolledCount", c.getEnrolledUsers().size());
                    m.put("semester", c.getSemester());
                    return m;
                })
                .collect(Collectors.toList());

        // Alertes absences : étudiants avec >= 3 absences non justifiées dans un cours
        int THRESHOLD = 3;
        Map<String, Integer> absenceCountPerStudent = new HashMap<>();

        for (Absence a : allAbsences) {
            if (!a.isJustified() && a.getStudent() != null) {
                String key = a.getStudent().getId() + "|" + (a.getCourse() != null ? a.getCourse().getId() : 0);
                absenceCountPerStudent.merge(key, 1, Integer::sum);
            }
        }

        List<Map<String, Object>> absenceAlerts = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : absenceCountPerStudent.entrySet()) {
            if (entry.getValue() >= THRESHOLD) {
                String[] parts = entry.getKey().split("\\|");
                Long studentId = Long.parseLong(parts[0]);
                Long courseId = Long.parseLong(parts[1]);
                userRepository.findById(studentId).ifPresent(student -> {
                    courseRepository.findById(courseId).ifPresent(course -> {
                        Map<String, Object> alert = new LinkedHashMap<>();
                        alert.put("studentId", studentId);
                        alert.put("studentName", student.getName());
                        alert.put("courseId", courseId);
                        alert.put("courseTitle", course.getTitle());
                        alert.put("absenceCount", entry.getValue());
                        absenceAlerts.add(alert);
                    });
                });
            }
        }

        // Activité récente (dernières absences)
        List<Map<String, Object>> recentAbsences = allAbsences.stream()
                .sorted(Comparator.comparingLong(Absence::getId).reversed())
                .limit(5)
                .map(a -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("studentName", a.getStudent() != null ? a.getStudent().getName() : "?");
                    m.put("courseTitle", a.getCourse() != null ? a.getCourse().getTitle() : "?");
                    m.put("date", a.getDate());
                    m.put("justified", a.isJustified());
                    return m;
                })
                .collect(Collectors.toList());

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("studentCount", studentCount);
        stats.put("teacherCount", teacherCount);
        stats.put("courseCount", courseCount);
        stats.put("roomCount", roomCount);
        stats.put("totalUsers", allUsers.size());
        stats.put("topCourses", topCourses);
        stats.put("absenceAlerts", absenceAlerts);
        stats.put("recentAbsences", recentAbsences);
        stats.put("absenceThreshold", THRESHOLD);

        return stats;
    }


}
