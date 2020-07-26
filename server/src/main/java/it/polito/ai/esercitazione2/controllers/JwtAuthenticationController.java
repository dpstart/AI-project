package it.polito.ai.esercitazione2.controllers;

import it.polito.ai.esercitazione2.config.JwtRequest;
import it.polito.ai.esercitazione2.config.JwtResponse;
import it.polito.ai.esercitazione2.config.JwtTokenUtil;

import it.polito.ai.esercitazione2.dtos.ValidUserList;
import net.minidev.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.provisioning.JdbcUserDetailsManager;
import org.springframework.web.bind.annotation.*;


import javax.validation.Valid;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin
public class JwtAuthenticationController {
    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private JwtTokenUtil jwtTokenUtil;
    @Autowired
    private JdbcUserDetailsManager jdbcUserDetailsManager;


    @RequestMapping(value = "/authenticate", method = RequestMethod.POST)
    public ResponseEntity<?> createAuthenticationToken(@RequestBody JwtRequest authenticationRequest) throws Exception {
        authenticate(authenticationRequest.getUsername(), authenticationRequest.getPassword());
        final UserDetails userDetails = jdbcUserDetailsManager.loadUserByUsername(authenticationRequest.getUsername());
        final String token = jwtTokenUtil.generateToken(userDetails);
        return ResponseEntity.ok(new JwtResponse(token));
    }

    @RequestMapping(value = "/register", method = RequestMethod.POST)
    public ResponseEntity<?> registerUser(@RequestBody Map<String,String> input) throws InterruptedException {

        if (!input.containsKey("id") || !input.containsKey("pwd") || !input.containsKey("role") || input.size()>3)
            //throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
            return ResponseEntity.ok(false);
        String id=input.get("id");
        String pwd = input.get("pwd");
        String role=input.get("role");

        List<GrantedAuthority> auth = new ArrayList<>();
        auth.add(new SimpleGrantedAuthority(role));

        //TO DO: check
        UserDetails user = new User(id,pwd,false,true,true,true,auth);
        try {
            jdbcUserDetailsManager.createUser(user);
        }
        catch(Exception e){
            //throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Problems with the insertion of a new user");
            return ResponseEntity.ok(false);
        }
        return ResponseEntity.ok(true);
    }

    @RequestMapping(value = "/registerMany", method = RequestMethod.POST)
    public ResponseEntity<?> registerUsers(@RequestBody @Valid ValidUserList users) throws InterruptedException {

        for (JSONObject input:  users.getList()) {
            if (!input.containsKey("id") || !input.containsKey("pwd") || !input.containsKey("role") || input.size() > 3)
                //throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
                return ResponseEntity.ok(false);
            String id = (String)input.get("id");
            String pwd = (String)input.get("pwd");
            String role = (String)input.get("role");

            List<GrantedAuthority> auth = new ArrayList<>();
            auth.add(new SimpleGrantedAuthority(role));

            //TO DO: check
            UserDetails user = new User(id,pwd,false,true,true,true,auth);
            try {
                jdbcUserDetailsManager.createUser(user);
            }
            catch(Exception e){
               // throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Problems with the insertion of a new user");
                return ResponseEntity.ok(false);
            }
        }
        return ResponseEntity.ok(true);
    }

    @RequestMapping(value = "/activate", method = RequestMethod.POST)
    public ResponseEntity<?> activateUser(@RequestBody Map<String,String> input) throws InterruptedException {
        if (!input.containsKey("id") || input.size()>1)
            //throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
            return ResponseEntity.ok(false);
        String id=input.get("id");

        try {

            UserDetails user=jdbcUserDetailsManager.loadUserByUsername(id);
            jdbcUserDetailsManager.updateUser(new User(user.getUsername(),user.getPassword(),true,true,true,true,user.getAuthorities()));
        }
        catch(Exception e){

            //throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Problems with the insertion of a new user");
            return ResponseEntity.ok(false);
        }
        return ResponseEntity.ok(true);
    }

    @RequestMapping(value = "/removeMany", method = RequestMethod.POST)
    public ResponseEntity<?> deleteUsers(@RequestBody @Valid ValidUserList users) throws InterruptedException {

        for (JSONObject input:  users.getList()) {
            if (!input.containsKey("id")  || input.size() > 1)
                //throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
                return ResponseEntity.ok(false);
            String id = (String)input.get("id");

            try {
                jdbcUserDetailsManager.deleteUser(id);
            }
            catch(Exception e){
                // throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Problems with the insertion of a new user");
                return ResponseEntity.ok(false);
            }
        }
        return ResponseEntity.ok(true);
    }


    private void authenticate(String username, String password) throws Exception {
        try {

            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(username, password));
        } catch (DisabledException e) {

            throw new Exception("USER_DISABLED", e);
        } catch (BadCredentialsException e) {

            throw new Exception("INVALID_CREDENTIALS", e);
        }
    }
}
