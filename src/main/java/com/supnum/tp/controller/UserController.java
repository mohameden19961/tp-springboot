package com.supnum.tp.controller;

import com.supnum.tp.model.*;
import com.supnum.tp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired private UserService userService;
    @Autowired private com.supnum.tp.repository.QuizResultRepository quizResultRepository;

    @GetMapping("/me")
    public User getCurrentUser() {
        return userService.getCurrentUser();
    }

    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @PutMapping("/{id}/role")
    public User updateRole(@PathVariable Long id, @RequestParam String role) {
        return userService.setRole(id, role);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }

    @Transactional(readOnly = true)
    @GetMapping("/me/analytics")
    public List<Map<String, Object>> getMyAnalytics() {
        User me = userService.getCurrentUser();
        List<QuizResult> results = quizResultRepository.findByStudent(me);
        List<Map<String, Object>> res = new ArrayList<>();
        
        for (QuizResult r : results) {
            try {
                Map<String, Object> map = new HashMap<>();
                Quiz quiz = r.getQuiz();
                if (quiz == null) continue;
                
                map.put("quizId", quiz.getId());
                map.put("quizTitle", quiz.getTitle());
                map.put("courseTitle", quiz.getCourse() != null ? quiz.getCourse().getTitle() : "N/A");
                map.put("semester", quiz.getCourse() != null ? quiz.getCourse().getSemester() : "N/A");
                map.put("score", r.getScore());
                map.put("totalPoints", quiz.getPoints());
                map.put("submittedAt", r.getSubmittedAt() != null ? r.getSubmittedAt().toString() : "");
                res.add(map);
            } catch (Exception e) {
                // Skip malformed results
            }
        }
        return res;
    }
}
