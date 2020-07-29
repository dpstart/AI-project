package it.polito.ai.esercitazione2.services;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.stream.Collectors;

public interface JWTService {

    void authenticate(String username, String password) throws Exception;

    UserDetails getUser(String username);
    String generateToken(UserDetails u);
    String generateRegisterRequest(String id, String password, Collection<String> roles);


    void createUser(String id, String pwd, Collection<GrantedAuthority> roles) throws Exception;

    void activate(String username) throws Exception;

    void deleteUser(String id) throws Exception;

}
