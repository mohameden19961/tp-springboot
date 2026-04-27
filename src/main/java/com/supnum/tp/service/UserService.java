package com.supnum.tp.service;

import com.supnum.tp.model.User;
import com.supnum.tp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User getCurrentUser() {
        String email = getCurrentUserEmail();
        return userRepository.findByEmail(email).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utilisateur non trouvé"));
    }

    public List<User> searchUsers(String query) {
        // Optionnel : chercher par nom ou email
        return userRepository.findAll().stream()
               .filter(u -> u.getName().toLowerCase().contains(query.toLowerCase()) || 
                            u.getEmail().toLowerCase().contains(query.toLowerCase()))
               .toList();
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User setRole(Long userId, String role) {
        User user = userRepository.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setRole(role);
        return userRepository.save(user);
    }

    public void deleteUser(Long userId) {
        userRepository.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        userRepository.deleteById(userId);
    }

    public String getCurrentUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) return "anonymous";
        
        Object principal = auth.getPrincipal();
        if (principal instanceof org.springframework.security.oauth2.core.user.OAuth2User) {
            return ((org.springframework.security.oauth2.core.user.OAuth2User) principal).getAttribute("email");
        }
        if (principal instanceof String) {
            return (String) principal;
        }
        return principal.toString();
    }
}
