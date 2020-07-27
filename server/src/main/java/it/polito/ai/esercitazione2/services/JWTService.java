package it.polito.ai.esercitazione2.services;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.List;

public interface JWTService {

    void authenticate(String username, String password) throws Exception;

    UserDetails getUser(String username);
    String generateToken(UserDetails u);

    void createUser(String id, String pwd, String role) throws Exception;

    void activate(String username) throws Exception;

    void deleteUser(String id) throws Exception;

}
