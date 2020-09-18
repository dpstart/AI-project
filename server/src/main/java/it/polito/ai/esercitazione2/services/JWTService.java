package it.polito.ai.esercitazione2.services;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.stream.Collectors;

public interface JWTService {

    // verify the user's credentials and generate the auhtentication token
    void authenticate(String username, String password) throws Exception;

    //retireve the UserDetails from the username string
    UserDetails getUser(String username);

    // generate token containing user's information
    String generateToken(UserDetails u);

    String generateRegisterRequest(String id, String password, Collection<String> roles);

    // add new user with role "roles" to the DB.
    void createUser(String id, String pwd, Collection<GrantedAuthority> roles) throws Exception;
    // activate the user
    void activate(String username) throws Exception;
    // delete the user
    void deleteUser(String id) throws Exception;

}
