package com.supnum.tp.security;

import com.supnum.tp.model.User;
import com.supnum.tp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
public class OAuth2UserService extends DefaultOAuth2UserService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) {
        OAuth2User oAuth2User = super.loadUser(request);

        String email = oAuth2User.getAttribute("email");
        String name  = oAuth2User.getAttribute("name");
        String pic   = oAuth2User.getAttribute("picture");

        // Assurer que l'utilisateur existe et a le bon rôle
        User user = userRepository.findByEmail(email).orElse(new User());
        user.setEmail(email);
        user.setName(name);
        user.setPicture(pic);
        String role = "24068@supnum.mr".equals(email) ? "ADMIN" : "USER";
        user.setRole(role);
        userRepository.save(user);

        return oAuth2User;
    }
}
