package it.polito.ai.esercitazione2.controllers;


import it.polito.ai.esercitazione2.config.JwtRequest;
import it.polito.ai.esercitazione2.config.JwtResponse;
import it.polito.ai.esercitazione2.dtos.SettingsDTO;
import it.polito.ai.esercitazione2.dtos.TeamDTO;
import it.polito.ai.esercitazione2.services.TeamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import javax.naming.AuthenticationException;
import javax.validation.Valid;

@RestController
@RequestMapping("/API/login")
public class LoginController {

    @Autowired
    TeamService teamService;

    @PostMapping("/")
    public ResponseEntity<?> login(@RequestBody JwtRequest authenticationRequest) {

        try{
            JwtResponse r = teamService.loginUser(authenticationRequest);
            return ResponseEntity.ok(r);
        } catch(AuthenticationServiceException e){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        } catch (Exception e){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }

    }


}
