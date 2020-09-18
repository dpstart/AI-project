package it.polito.ai.esercitazione2.controllers;

import it.polito.ai.esercitazione2.exceptions.NotificationServiceException;
import it.polito.ai.esercitazione2.exceptions.TeamNotFoundException;
import it.polito.ai.esercitazione2.services.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;


@RestController
@RequestMapping("/notification")
public class NotificationController {

    @Autowired
    NotificationService notificationService;

    // the user associated to the token accepts the team proposal
    @GetMapping("/confirm/{token}")
    public boolean confirm(@PathVariable String token) {

        try {
            return notificationService.confirm(token);

        } catch (NotificationServiceException | TeamNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    // the user associated to the token rejects the team proposal
    @GetMapping("/reject/{token}")
    public boolean reject(@PathVariable String token) {
        try {
            return notificationService.reject(token);

        } catch (NotificationServiceException | TeamNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }

    }

    // activate the account associated to the token
    @GetMapping("/activate/{token}")
    public boolean activate(@PathVariable String token) {
        try {
            return notificationService.activate(token);

        } catch (NotificationServiceException | TeamNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }
}
