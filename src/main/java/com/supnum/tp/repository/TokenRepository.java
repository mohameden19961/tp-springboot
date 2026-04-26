package com.supnum.tp.repository;

import com.supnum.tp.model.Token;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

public interface TokenRepository extends JpaRepository<Token, Long> {
    Optional<Token> findByTokenAndValidTrue(String token);
    Optional<Token> findByRefreshTokenAndValidTrue(String refreshToken);

    @Modifying
    @Transactional
    @Query("DELETE FROM Token t WHERE t.email = :email")
    void deleteByEmail(String email);
}
