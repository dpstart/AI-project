package it.polito.ai.esercitazione2.services;

import it.polito.ai.esercitazione2.config.JwtTokenUtil;
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

import java.util.ArrayList;
import java.util.List;

public class JWTServiceImpl implements JWTService {

    @Autowired
    AuthenticationManager authenticationManager;
    @Autowired
    JwtTokenUtil jwtTokenUtil;
    @Autowired
    JdbcUserDetailsManager jdbcUserDetailsManager;

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

    @Override
    public void createUser(String id, String pwd, String role) throws Exception {
        List<GrantedAuthority> auth = new ArrayList<>();
        auth.add(new SimpleGrantedAuthority(role));

        //TO DO: check
        UserDetails user = new User(id, pwd, false, true, true, true, auth);
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
