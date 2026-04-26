package com.supnum.tp.controller;

import com.supnum.tp.model.User;
import com.supnum.tp.repository.UserRepository;
import com.supnum.tp.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
public class LoginController {

    @Autowired private JwtService jwtService;
    @Autowired private UserRepository userRepository;
    @Autowired private com.supnum.tp.repository.TokenRepository tokenRepository;

    @GetMapping("/api/auth/token")
    public Map<String, Object> getTokens() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Déconnecté");
            error.put("message", "Merci de vous reconnecter sur http://localhost:8080/login");
            return error;
        }

        try {
            String email;
            if (auth.getPrincipal() instanceof OAuth2User) {
                email = ((OAuth2User) auth.getPrincipal()).getAttribute("email");
            } else {
                email = auth.getName();
            }

            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) return Map.of("error", "Utilisateur non trouvé");

            String accessToken = jwtService.generateToken(email, user.getRole());
            String refreshToken = jwtService.generateRefreshToken(email);

            return Map.of(
                "access_token", accessToken,
                "refresh_token", refreshToken,
                "user", Map.of("name", user.getName(), "email", user.getEmail())
            );
        } catch (Exception e) {
            return Map.of("error", "Erreur: " + e.getMessage());
        }
    }

    @PostMapping("/api/auth/refresh")
    public Map<String, Object> refresh(@RequestParam("refresh_token") String refreshToken) {
        try {
            // 1. Vérifier si le refresh token est valide et est bien de type 'refresh'
            if (jwtService.isTokenValid(refreshToken) && "refresh".equals(jwtService.extractType(refreshToken))) {
                String email = jwtService.extractEmail(refreshToken);
                
                User user = userRepository.findByEmail(email).orElseThrow(() -> new Exception("User non trouvé"));
                
                // 2. Générer un nouvel access token
                String newAccessToken = jwtService.generateToken(email, user.getRole());
                
                // 3. Mettre à jour en BDD
                tokenRepository.deleteByEmail(email);
                com.supnum.tp.model.Token tokenEntity = new com.supnum.tp.model.Token();
                tokenEntity.setToken(newAccessToken);
                tokenEntity.setRefreshToken(refreshToken);
                tokenEntity.setEmail(email);
                tokenEntity.setCreatedAt(LocalDateTime.now());
                tokenEntity.setExpiresAt(LocalDateTime.now().plusMinutes(15));
                tokenEntity.setValid(true);
                tokenRepository.save(tokenEntity);

                return Map.of(
                    "access_token", newAccessToken,
                    "refresh_token", refreshToken
                );
            } else {
                return Map.of("error", "Refresh token invalide ou expiré");
            }
        } catch (Exception e) {
            return Map.of("error", "Erreur refresh: " + e.getMessage());
        }
    }
}
