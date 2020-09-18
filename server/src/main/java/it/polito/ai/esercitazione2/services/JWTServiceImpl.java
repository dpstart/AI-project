package it.polito.ai.esercitazione2.services;

import it.polito.ai.esercitazione2.config.JwtTokenUtil;
import it.polito.ai.esercitazione2.entities.Professor;
import it.polito.ai.esercitazione2.entities.Student;
import it.polito.ai.esercitazione2.repositories.ProfessorRepository;
import it.polito.ai.esercitazione2.repositories.StudentRepository;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.provisioning.JdbcUserDetailsManager;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Service
@Transactional
@Log(topic = "JWT Service")
public class JWTServiceImpl implements JWTService {

    @Autowired
    AuthenticationManager authenticationManager;
    @Autowired
    JwtTokenUtil jwtTokenUtil;
    @Autowired
    JdbcUserDetailsManager jdbcUserDetailsManager;
    @Autowired
    ProfessorRepository professorRepository;
    @Autowired
    StudentRepository studentRepository;

    @Override
    public void authenticate(String username, String password) throws Exception {
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(username, password));
        } catch (DisabledException e) {

            throw new Exception("USER_DISABLED", e);
        } catch (BadCredentialsException e) {

            throw new Exception("INVALID_CREDENTIALS", e);
        }
    }

    @Override
    public UserDetails getUser(String username){
        return jdbcUserDetailsManager.loadUserByUsername(username);
    }

    @Override
    public String generateToken(UserDetails u){
        return jwtTokenUtil.generateToken(u);
    }

    public String generateRegisterRequest(String id, String password, Collection<String> roles) {
        return jwtTokenUtil.generateRegisterRequest(id,password,roles);}


    @Override
    public void createUser(String id,String pwd, Collection<GrantedAuthority> roles) throws Exception {
        UserDetails user = new User(id, pwd, false, true, true, true, roles);
        jdbcUserDetailsManager.createUser(user);
    }

    @Override
    public void activate(String id) throws Exception {
            UserDetails user = jdbcUserDetailsManager.loadUserByUsername(id);
            jdbcUserDetailsManager.updateUser(new User(user.getUsername(), user.getPassword(), true, true, true, true, user.getAuthorities()));
    }


    @Override
    public void deleteUser(String id) throws Exception{
        jdbcUserDetailsManager.deleteUser(id);
    }


}
