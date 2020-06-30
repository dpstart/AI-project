package it.polito.ai.esercitazione2.controllers;

import it.polito.ai.esercitazione2.dtos.SettingsDTO;
import it.polito.ai.esercitazione2.dtos.VMDTO;
import it.polito.ai.esercitazione2.dtos.VMModelDTO;
import it.polito.ai.esercitazione2.exceptions.*;
import it.polito.ai.esercitazione2.services.TeamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AuthorizationServiceException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/API/teams")
public class TeamController {

    @Autowired
    TeamService teamservice;

    @GetMapping("/vmmodels")
    List<VMModelDTO> getVMModels(){
        return teamservice.getVMModels();
    }

    @PostMapping("/vmmodels")
    @ResponseStatus(HttpStatus.OK)
    void createVMModel(@RequestBody Map<String,String> modelName){
        if (!modelName.containsKey("name") || modelName.keySet().size()>1){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Expected one parameter: usage 'name':<modelName>");
        }
        if (!teamservice.createVMModel(modelName.get("name")))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "already existing VM Model");
    }



    @PostMapping("/{id}/model")  // ragionare su se è più logico accedere direttamente a qualuenue team perdendo il riferimento al corso oppure /APU/courses/PDS/{teamID}
    void defineVMmodelForATeam(@PathVariable Long id, @RequestBody Map<String,String> input){
        if (!input.containsKey("model") || input.keySet().size()>1){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Expected one parameter: usage 'model':<modelName>");
        }

        try{
            teamservice.defineVMModel(id,input.get("model"));
        }
        catch (AuthorizationServiceException e){
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());  //DA CAMBIARE!!!!
        }
        catch(IncoherenceException e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
        catch (TeamServiceException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }

    }


    @PostMapping("/{id}")  // ragionare su se è più logico accedere direttamente a qualuenue team perdendo il riferimento al corso oppure /APU/courses/PDS/{teamID}
    VMDTO createVM(@PathVariable Long id, @Valid @RequestBody SettingsDTO settings){
        if (settings.getMax_active()==null) //contemporary active
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "'Max active' field not expected here");
        if (settings.getMax_available()==null) //active + off
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "'Max available' field not expected here");

        try{
            return teamservice.createVM(id,settings);
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

    @GetMapping("/{id}/run")
    void runVM(@PathVariable Long id){
            try{
                teamservice.runVM(id);
            } catch(VMInstanceNotFoundException e){
                throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
            } catch(TeamAuthorizationException e){
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,e.getMessage());
            } catch(UnavailableResourcesForTeamException e){
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,e.getMessage());
            } catch (VMAlreadyInExecutionException e){
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,e.getMessage());
            }
    }

    @GetMapping("{id}/stop")
    void stopVM(@PathVariable Long id){
        try{
            teamservice.stopVM(id);
        } catch(VMInstanceNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        } catch(TeamAuthorizationException e){
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,e.getMessage());
        } catch(UnavailableResourcesForTeamException e){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,e.getMessage());
        } catch (VMAlreadyInExecutionException e){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,e.getMessage());
        }
    }

    //void turnoffVM(); //solo owner

    @GetMapping("{id}/cancel")
    void removeVM(@PathVariable Long id){
        try{
            teamservice.removeVM(id);
        } catch(VMInstanceNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        } catch(TeamAuthorizationException e){
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,e.getMessage());
        } catch (RemoveRunningMachineException e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }

    }

    //void shareOwnership();


}
