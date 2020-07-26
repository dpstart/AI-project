package it.polito.ai.esercitazione2.controllers;

import it.polito.ai.esercitazione2.exceptions.NotificationServiceException;
import it.polito.ai.esercitazione2.exceptions.TeamNotFoundException;
import it.polito.ai.esercitazione2.services.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;


@Controller
@RequestMapping("/notification/**")
public class NotificationController {

    @Autowired
    NotificationService notificationService;

    @GetMapping("/confirm/{token}")
    public String confirm(@PathVariable String token, Model m){

        try{
            if (!notificationService.confirm(token))
                m.addAttribute("message","You accepted the invitation!\n There are some pending invitations");
            else
                m.addAttribute("message","You accepted the invitation!\n The team is now activated!");

        }catch(NotificationServiceException e){
            m.addAttribute("message", e.getMessage());
        }catch(TeamNotFoundException e){
            m.addAttribute("message", e.getMessage());
        }catch(HttpClientErrorException e){
            m.addAttribute("message",e.getStatusCode()+"");
        }
        return "confirm";
    }

    @GetMapping("/reject/{token}")
    public String reject(@PathVariable String token,Model m){
        try{
            if(!notificationService.reject(token))
                m.addAttribute("message","Some problems occurs");
            else
                m.addAttribute("message","You rejected the invitation!\nThe team is now evicted");
        }catch(NotificationServiceException e){
            m.addAttribute("message", e.getMessage());
        }catch(TeamNotFoundException e){
            m.addAttribute("message", e.getMessage());
        }catch(HttpClientErrorException e){
            m.addAttribute("message",e.getStatusCode()+"");
        }
        return "reject";

    }

    @GetMapping("/activate/{token}")
    public String activate(@PathVariable String token, Model m){

        try{
            if (notificationService.activate(token))
                m.addAttribute("message","Your account has been succesfully activated!");


        }catch(NotificationServiceException e){
            m.addAttribute("message", e.getMessage());
        }catch(TeamNotFoundException e){
            m.addAttribute("message", e.getMessage());
        }catch(HttpClientErrorException e){
            m.addAttribute("message",e.getStatusCode()+"");
        }
        return "confirm";
    }


}
