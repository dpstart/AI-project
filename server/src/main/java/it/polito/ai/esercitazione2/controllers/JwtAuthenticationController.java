package it.polito.ai.esercitazione2.controllers;

import it.polito.ai.esercitazione2.config.JwtRequest;
import it.polito.ai.esercitazione2.config.JwtResponse;
import it.polito.ai.esercitazione2.config.JwtTokenUtil;

import it.polito.ai.esercitazione2.dtos.ValidUserList;
import it.polito.ai.esercitazione2.services.JWTService;
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
import org.springframework.web.server.ResponseStatusException;


import javax.validation.Valid;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin
public class JwtAuthenticationController {

    @Autowired
    JWTService jwtservice;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;


    @RequestMapping(value = "/authenticate", method = RequestMethod.POST)
    public ResponseEntity<?> createAuthenticationToken(@RequestBody JwtRequest authenticationRequest) throws Exception {
        jwtservice.authenticate(authenticationRequest.getUsername(), authenticationRequest.getPassword());
        final UserDetails userDetails = jwtservice.getUser(authenticationRequest.getUsername());
        final String token = jwtservice.generateToken(userDetails);
        return ResponseEntity.ok(new JwtResponse(token));
    }

    @RequestMapping(value = "/register", method = RequestMethod.POST)
    public ResponseEntity<?> registerUser(@RequestBody JwtResponse input) throws InterruptedException {
        String token = input.getToken();
        String username = null;
        String pwd = null;
        Collection<GrantedAuthority> roles=null;
        try {

            username = jwtTokenUtil.getUsernameFromToken(token);
            roles = jwtTokenUtil.getAuthorities(token);
            pwd = jwtTokenUtil.getPassword(token);
            System.out.println(username+"..."+roles+"..."+pwd);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(false);
        }

        try {
            jwtservice.createUser(username,pwd,roles);

        }
        catch(Exception e){
            //throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Problems with the insertion of a new user");
            return ResponseEntity.ok(false);
        }
        return ResponseEntity.ok(true);
    }

    @RequestMapping(value = "/registerMany", method = RequestMethod.POST)
    public ResponseEntity<?> registerUsers(@RequestBody @Valid ValidUserList users) throws InterruptedException {
        String token =null;
        String username = null;
        String pwd = null;
        Collection<GrantedAuthority> roles=null;
        for (JSONObject input:  users.getList()) {
              if (!input.containsKey("token")  || input.size() > 1)
                return ResponseEntity.ok(false);
            token = (String)input.get("token");
            try {
                username = jwtTokenUtil.getUsernameFromToken(token);
                roles = jwtTokenUtil.getAuthorities(token);
                pwd = jwtTokenUtil.getPassword(token);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.ok(false);
            }

            try {
                jwtservice.createUser(username,pwd,roles);
            }
            catch(Exception e){
               // throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Problems with the insertion of a new user");
                return ResponseEntity.ok(false);
            }
        }
        return ResponseEntity.ok(true);
    }

    @RequestMapping(value = "/activate", method = RequestMethod.POST)
    public ResponseEntity<?> activateUser(@RequestBody JwtResponse input) throws InterruptedException {
        String token = input.getToken();
        String username = null;

        try {

            username = jwtTokenUtil.getUsernameFromToken(token);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(false);
        }

        try {
            jwtservice.activate(username);
        }
        catch(Exception e){
            //throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Problems with the insertion of a new user");
            return ResponseEntity.ok(false);
        }
        return ResponseEntity.ok(true);
    }

    @RequestMapping(value = "/removeMany", method = RequestMethod.POST)
    public ResponseEntity<?> deleteUsers(@RequestBody @Valid ValidUserList users) throws InterruptedException {
        String token=null;
        String id=null;
        for (JSONObject input:  users.getList()) {
            if (!input.containsKey("token")  || input.size() > 1)
                return ResponseEntity.ok(false);
            token = (String)input.get("token");
            try {

                id = jwtTokenUtil.getUsernameFromToken(token);

            } catch (IllegalArgumentException e) {
                return ResponseEntity.ok(false);
            }


            try {
                jwtservice.deleteUser(id);
            }
            catch(Exception e){
                // throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Problems with the insertion of a new user");
                return ResponseEntity.ok(false);
            }
        }
        return ResponseEntity.ok(true);
    }



}
