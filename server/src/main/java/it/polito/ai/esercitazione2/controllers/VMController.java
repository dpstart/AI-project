package it.polito.ai.esercitazione2.controllers;

import it.polito.ai.esercitazione2.dtos.SettingsDTO;
import it.polito.ai.esercitazione2.dtos.VMDTO;
import it.polito.ai.esercitazione2.dtos.VMModelDTO;
import it.polito.ai.esercitazione2.entities.Image;
import it.polito.ai.esercitazione2.exceptions.*;
import it.polito.ai.esercitazione2.services.TeamService;
import it.polito.ai.esercitazione2.services.VMService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AuthorizationServiceException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/API/vms")
public class VMController {

    @Autowired
    TeamService teamservice;

    @Autowired
    VMService vmservice;


    @PostMapping("/{id}/createVM")  // ragionare su se è più logico accedere direttamente a qualuenue team perdendo il riferimento al corso oppure /APU/courses/PDS/{teamID}
    VMDTO createVM(@PathVariable Long id, @RequestPart(value="image") MultipartFile file, @Valid @RequestPart("settings") SettingsDTO settings){
        if (settings.getMax_active()==null) //contemporary active
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "'Max active' field not expected here");
        if (settings.getMax_available()==null) //active + off
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "'Max available' field not expected here");

        try{
            return vmservice.createVM(id,file,settings);
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

    @GetMapping("/{id}")
    VMDTO getVM(@PathVariable Long id){
        try{
            return ModelHelper.enrich(vmservice.getVM(id));
        }catch (TeamServiceException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }
    }

    //TO DO: convert image to mUltiPaertfiLE
    @GetMapping("/{id}/connect")
    Image connectToVM(@PathVariable Long id){
        try{
            return vmservice.connectToVM(id);
        }catch (TeamServiceException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }
    }

    @GetMapping("/{id}/run")
    void runVM(@PathVariable Long id){
            try{
                vmservice.runVM(id);
            } catch(VMInstanceNotFoundException e){
                throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
            } catch(TeamAuthorizationException e){
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,e.getMessage());
            } catch(UnavailableResourcesForTeamException e){
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,e.getMessage());
            } catch (VMAlreadyInExecutionException e){
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,e.getMessage());
            } catch (CourseNotEnabledException e){
                throw new ResponseStatusException(HttpStatus.PRECONDITION_REQUIRED,e.getMessage());
            }
    }

    @GetMapping("{id}/stop")
    void stopVM(@PathVariable Long id){
        try{
            vmservice.stopVM(id);
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
            vmservice.removeVM(id);
        } catch(VMInstanceNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        } catch(TeamAuthorizationException e){
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,e.getMessage());
        } catch (RemoveRunningMachineException e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }

    }

    @PostMapping("{id}/share")
    void shareOwnershipWithOne(@PathVariable Long id,@RequestBody Map<String,String> input){
        if (!input.containsKey("id") || input.keySet().size()>1)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Expected only one field: usage 'id':<studentName>");
        String user=input.get("id");
        try{
            vmservice.shareOwnership(id,user);
        }catch(TeamServiceException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }

    }

    @GetMapping("/teams/{team_id}")
    List<VMDTO> getVMsByTeam(@PathVariable Long team_id){
        try {
            return vmservice.getVMByTeam(team_id);
        }
        catch(TeamNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }
    }

}
