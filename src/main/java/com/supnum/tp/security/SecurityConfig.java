package com.supnum.tp.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired private JwtFilter jwtFilter;
    @Autowired private OAuth2UserService oAuth2UserService;
    @Autowired private OAuth2SuccessHandler oAuth2SuccessHandler;
    @Autowired private com.supnum.tp.repository.TokenRepository tokenRepository;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                // Autoriser le login et l'affichage des tokens
                .requestMatchers("/login/**", "/oauth2/**", "/api/auth/token").permitAll()
                .anyRequest().authenticated()
            )
            // Configuration OAuth2 Google
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(oAuth2UserService)
                )
                .successHandler(oAuth2SuccessHandler)
            )
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)) // Nécessaire pour le flux OAuth2
            .exceptionHandling(exceptions -> exceptions
                .defaultAuthenticationEntryPointFor(
                    (request, response, authException) -> {
                        response.setStatus(401);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\": \"Non autorisé - Merci de vous connecter via Google sur /login pour obtenir un token.\"}");
                    },
                    request -> request.getServletPath().startsWith("/api/")
                )
            )
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/login")
                .addLogoutHandler((request, response, authentication) -> {
                    // Supprimer physiquement le cookie
                    jakarta.servlet.http.Cookie cookie = new jakarta.servlet.http.Cookie("jwt", null);
                    cookie.setPath("/");
                    cookie.setMaxAge(0);
                    response.addCookie(cookie);
                    
                    // Invalider le token en BDD si présent
                    String jwt = null;
                    String authHeader = request.getHeader("Authorization");
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        jwt = authHeader.substring(7);
                    } else if (request.getCookies() != null) {
                        jwt = java.util.Arrays.stream(request.getCookies())
                            .filter(c -> c.getName().equals("jwt"))
                            .map(jakarta.servlet.http.Cookie::getValue)
                            .findFirst()
                            .orElse(null);
                    }

                    if (jwt != null) {
                        tokenRepository.findByTokenAndValidTrue(jwt).ifPresent(t -> {
                            t.setValid(false);
                            tokenRepository.save(t);
                        });
                    }
                })
                .deleteCookies("JSESSIONID", "jwt")
                .invalidateHttpSession(true)
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
