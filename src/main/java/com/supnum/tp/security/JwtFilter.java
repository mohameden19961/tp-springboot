package com.supnum.tp.security;

import com.supnum.tp.repository.TokenRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired private JwtService jwtService;
    @Autowired private TokenRepository tokenRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        String jwt = null;

        // 1. Cherche dans le header
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
        }
        
        // 2. Sinon cherche dans le cookie "jwt"
        if (jwt == null && request.getCookies() != null) {
            jwt = Arrays.stream(request.getCookies())
                .filter(c -> c.getName().equals("jwt"))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
        }

        if (jwt != null) {
            // VERIFICATION EN BDD : Est-ce que le token est présent et valide ?
            boolean isTokenInDb = tokenRepository.findByTokenAndValidTrue(jwt).isPresent();
            
            if (isTokenInDb && SecurityContextHolder.getContext().getAuthentication() == null) {
                // Utilise extractEmail et isTokenValid (qui existent dans JwtService.java)
                if (jwtService.isTokenValid(jwt)) {
                    String email = jwtService.extractEmail(jwt);
                    String role  = jwtService.extractRole(jwt);

                    if (email != null) {
                        UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(
                                email, null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + role))
                            );
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    }
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
