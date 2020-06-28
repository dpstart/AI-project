package it.polito.ai.esercitazione2.controllers;

import it.polito.ai.esercitazione2.dtos.SettingsDTO;
import it.polito.ai.esercitazione2.exceptions.TeamNotFoundException;
import it.polito.ai.esercitazione2.exceptions.TeamServiceException;
import it.polito.ai.esercitazione2.exceptions.UnavailableResourcesForTeamException;
import it.polito.ai.esercitazione2.services.TeamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AuthorizationServiceException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.Valid;

@RestController
@RequestMapping("/API/teams")
public class TeamController {

    @Autowired
    TeamService teamservice;


    @PostMapping("/{id}")  // ragionare su se è più logico accedere direttamente a qualuenue team perdendo il riferimento al corso oppure /APU/courses/PDS/{teamID}
    void createVM(@PathVariable Long id, @Valid @RequestBody SettingsDTO settings){
        if (settings.getMax_active()==null) //contemporary active
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "'Max active' field not expected here");
        if (settings.getMax_available()==null) //active + off
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "'Max available' field not expected here");

        try{
            teamservice.createVM(id,settings);
        }
        catch (AuthorizationServiceException e){
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());  //DA CAMBIARE!!!!
        }
        catch ( TeamNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }
        catch ( UnavailableResourcesForTeamException e){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,e.getMessage());
        }

    }

    //void removeVM(); //solo owner

    //void runVM();  //solo owner

   // void stopVM();

    //void turnoffVM(); //solo owner

    //void shareOwnership();


}
