package com.supnum.tp.security;

import com.supnum.tp.model.Token;
import com.supnum.tp.model.User;
import com.supnum.tp.repository.TokenRepository;
import com.supnum.tp.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    @Autowired private JwtService jwtService;
    @Autowired private UserRepository userRepository;
    @Autowired private TokenRepository tokenRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        
        String email   = oAuth2User.getAttribute("email");
        String name    = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");

        // Créer ou mettre à jour l'utilisateur
        User user = userRepository.findByEmail(email).orElse(new User());
        user.setEmail(email);
        user.setName(name);
        user.setPicture(picture);
        String role = "24068@supnum.mr".equals(email) ? "ADMIN" : "USER";
        user.setRole(role);
        userRepository.save(user);

        // Nettoyer les anciens tokens
        tokenRepository.deleteByEmail(email);

        // Générer les tokens (Access + Refresh)
        String accessToken  = jwtService.generateToken(email, user.getRole());
        String refreshToken = jwtService.generateRefreshToken(email);

        // Sauvegarder en BDD pour permettre la révocation
        Token token = new Token();
        token.setToken(accessToken);
        token.setRefreshToken(refreshToken);
        token.setEmail(email);
        token.setCreatedAt(LocalDateTime.now());
        token.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        token.setValid(true);
        tokenRepository.save(token);

        // Poser le cookie JWT pour le navigateur
        Cookie jwtCookie = new Cookie("jwt", accessToken);
        jwtCookie.setHttpOnly(true);
        jwtCookie.setPath("/");
        jwtCookie.setMaxAge(60 * 15);
        response.addCookie(jwtCookie);

        // Rediriger vers l'endpoint qui affiche les tokens en JSON
        response.sendRedirect("/api/auth/token");
    }
}
