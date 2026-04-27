package com.supnum.tp.repository;

import com.supnum.tp.model.QuizResult;
import com.supnum.tp.model.Quiz;
import com.supnum.tp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuizResultRepository extends JpaRepository<QuizResult, Long> {
    java.util.List<QuizResult> findByQuizAndStudentOrderByIdDesc(Quiz quiz, User student);
    java.util.List<QuizResult> findByQuiz(Quiz quiz);
    java.util.List<QuizResult> findByStudent(User student);
}
