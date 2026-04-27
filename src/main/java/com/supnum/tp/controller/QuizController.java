package com.supnum.tp.controller;

import com.supnum.tp.model.*;
import com.supnum.tp.repository.*;
import com.supnum.tp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.supnum.tp.service.FileStorageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

import org.springframework.messaging.simp.SimpMessagingTemplate;

@RestController
@RequestMapping("/courses/{courseId}/quizzes")
public class QuizController {

    @Autowired private QuizRepository quizRepository;
    @Autowired private QuizResultRepository quizResultRepository;
    @Autowired private com.supnum.tp.service.CourseService courseService;
    @Autowired private CourseRepository courseRepository;
    @Autowired private UserService userService;
    @Autowired private FileStorageService fileStorageService;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private SimpMessagingTemplate messagingTemplate;

    @GetMapping
    public List<Quiz> getQuizzes(@PathVariable Long courseId) {
        Course course = courseService.getById(courseId);
        return quizRepository.findByCourseOrderByIdDesc(course);
    }

    @Transactional
    @PostMapping
    public Quiz createQuiz(@PathVariable Long courseId,
                           @RequestParam("quiz") String quizJson,
                           @RequestParam(value = "file", required = false) MultipartFile file) throws Exception {
        Course course = courseRepository.findById(courseId).orElseThrow();
        Quiz quiz = objectMapper.readValue(quizJson, Quiz.class);

        if (file != null && !file.isEmpty()) {
            String fileName = fileStorageService.storeFile(file);
            quiz.setFileName(fileName);
        }

        quiz.setCourse(course);
        if (quiz.getQuestions() != null && !quiz.getQuestions().isEmpty()) {
            quiz.getQuestions().forEach(q -> q.setQuiz(quiz));
            validatePointsTotal(quiz);
        }
        Quiz saved = quizRepository.save(quiz);
        messagingTemplate.convertAndSend("/topic/updates/" + courseId, "REFRESH_DATA");
        return saved;
    }

    @PostMapping("/{quizId}/submit")
    public Map<String, Object> submitQuiz(@PathVariable Long courseId, @PathVariable Long quizId, @RequestBody Map<Long, Object> answers) {
        Quiz quiz = quizRepository.findById(quizId).orElseThrow();
        User user = userService.getCurrentUser();

        int score = 0;
        List<Question> questions = quiz.getQuestions();
        Map<Long, String> storedResponses = new HashMap<>();

        // Détail de correction question par question
        List<Map<String, Object>> corrections = new ArrayList<>();

        for (Question q : questions) {
            Object studentAnswer = answers.get(q.getId());
            boolean correct = false;
            String studentAnswerStr = studentAnswer != null ? studentAnswer.toString() : null;
            storedResponses.put(q.getId(), studentAnswerStr);

            if (studentAnswer != null) {
                try {
                    if ("RADIO".equals(q.getType())) {
                        if (q.getCorrectAnswers() != null && !q.getCorrectAnswers().isEmpty()) {
                            // Comparaison robuste (index vs index)
                            String correctIdx = q.getCorrectAnswers().get(0).toString();
                            correct = studentAnswer.toString().equals(correctIdx);
                        }
                    } else if ("CHECKBOX".equals(q.getType())) {
                        if (studentAnswer instanceof List && q.getCorrectAnswers() != null) {
                            List<?> studentIndices = (List<?>) studentAnswer;
                            Set<String> studentStr = studentIndices.stream().map(Object::toString).collect(java.util.stream.Collectors.toSet());
                            Set<String> correctStr = q.getCorrectAnswers().stream().map(Object::toString).collect(java.util.stream.Collectors.toSet());
                            correct = !studentStr.isEmpty() && studentStr.equals(correctStr);
                            studentAnswerStr = studentStr.toString();
                        }
                    } else if ("TEXT".equals(q.getType())) {
                        if (q.getCorrectText() != null) {
                            correct = studentAnswer.toString().trim().equalsIgnoreCase(q.getCorrectText().trim());
                        }
                    }
                } catch (Exception ignored) {}
            }

            if (correct) {
                score += (q.getPoints() != null ? q.getPoints() : 0);
            }

            // Construire l'objet de correction pour cette question
            Map<String, Object> correction = new HashMap<>();
            correction.put("questionId", q.getId());
            correction.put("questionText", q.getText());
            correction.put("type", q.getType());
            correction.put("correct", correct);
            correction.put("points", q.getPoints() != null ? q.getPoints() : 0);
            correction.put("earnedPoints", correct ? (q.getPoints() != null ? q.getPoints() : 0) : 0);
            correction.put("studentAnswer", studentAnswerStr);
            correction.put("correctAnswers", q.getCorrectAnswers());
            correction.put("correctText", q.getCorrectText());
            correction.put("options", q.getOptions());
            corrections.add(correction);
        }

        QuizResult result = new QuizResult();
        result.setQuiz(quiz);
        result.setStudent(user);
        result.setScore(score);
        result.setTotalQuestions(questions.size());
        result.setResponses(storedResponses);
        QuizResult saved = quizResultRepository.save(result);

        // Calcul du total de points possible
        int totalPoints = questions.stream().mapToInt(q -> q.getPoints() != null ? q.getPoints() : 0).sum();

        Map<String, Object> response = new HashMap<>();
        response.put("id", saved.getId());
        response.put("score", score);
        response.put("totalPoints", totalPoints > 0 ? totalPoints : 20);
        response.put("totalQuestions", questions.size());
        response.put("corrections", corrections);
        return response;
    }

    @Transactional
    @PutMapping("/{quizId}")
    public Quiz updateQuiz(@PathVariable Long courseId, @PathVariable Long quizId, @RequestBody Quiz quizDetails) {
        Quiz quiz = quizRepository.findById(quizId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz introuvable"));
        
        quiz.setTitle(quizDetails.getTitle());
        quiz.setDescription(quizDetails.getDescription());
        quiz.setTimeLimit(quizDetails.getTimeLimit());

        if (quizDetails.getQuestions() != null) {
            // Logique de synchronisation :
            // 1. On garde les références aux questions envoyées
            List<Question> newQuestions = quizDetails.getQuestions();
            
            // 2. On nettoie la liste actuelle (CascadeType.ALL et orphanRemoval feront le travail)
            quiz.getQuestions().clear();
            quizRepository.saveAndFlush(quiz); 

            // 3. On ajoute les nouvelles (en s'assurant que l'ID est null pour éviter les conflits de session)
            for (Question q : newQuestions) {
                q.setId(null); 
                q.setQuiz(quiz);
                quiz.getQuestions().add(q);
            }

            // 4. Validation
            int total = quiz.getQuestions().stream()
                    .mapToInt(q -> q.getPoints() != null ? q.getPoints() : 0)
                    .sum();
            
            if (total != 20 && !quiz.getQuestions().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Erreur : Le total des points (" + total + ") doit être exactement 20.");
            }
        }

        Quiz saved = quizRepository.save(quiz);
        messagingTemplate.convertAndSend("/topic/updates/" + courseId, "REFRESH_DATA");
        return saved;
    }

    // ─── Validation : Le total des points des questions doit être = 20 ─────────
    private void validatePointsTotal(Quiz quiz) {
        int total = quiz.getQuestions().stream()
                .mapToInt(q -> q.getPoints() != null ? q.getPoints() : 0)
                .sum();
        if (total != 20) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Le total des points des questions doit être égal à 20. Actuellement : " + total);
        }
    }

    @Transactional
    @DeleteMapping("/{quizId}")
    public void deleteQuiz(@PathVariable Long courseId, @PathVariable Long quizId) {
        quizRepository.deleteById(quizId);
        messagingTemplate.convertAndSend("/topic/updates/" + courseId, "REFRESH_DATA");
    }
}
