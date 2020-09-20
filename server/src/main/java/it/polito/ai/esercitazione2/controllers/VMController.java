package it.polito.ai.esercitazione2.controllers;

import it.polito.ai.esercitazione2.dtos.ImageDTO;
import it.polito.ai.esercitazione2.dtos.SettingsDTO;
import it.polito.ai.esercitazione2.dtos.VMDTO;
import it.polito.ai.esercitazione2.dtos.VMModelDTO;
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

    /*****************************************************************************
     *
     ******************* VM INSTANCES: operation  ********************************
     *
     *****************************************************************************/

    // the student owning the VM can run it
    @GetMapping("/{id}/run")
    void runVM(@PathVariable Long id){
        try{
            vmservice.runVM(id);
        } catch(VMInstanceNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        } catch(TeamAuthorizationException e){
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,e.getMessage());
        } catch(UnavailableResourcesForTeamException | VMAlreadyInExecutionException e){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,e.getMessage());
        } catch (CourseNotEnabledException e){
            throw new ResponseStatusException(HttpStatus.PRECONDITION_REQUIRED,e.getMessage());
        }
    }

    // a student of the team or the professor of the course can connect to a VM
    @GetMapping("/{id}/connect")
    ImageDTO connectToVM(@PathVariable Long id){
        try{
            return vmservice.connectToVM(id);
        }catch (CourseNotEnabledException | OffMachineException e){
            throw new ResponseStatusException(HttpStatus.PRECONDITION_REQUIRED,e.getMessage());
        } catch(TeamServiceException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }
    }

    // a VM's owner can update it
    @PostMapping("/{id}/update")
    void updateVM(@PathVariable Long id,@RequestPart(value="image",required=false) MultipartFile file, @Valid @RequestPart("settings") SettingsDTO settings){
        if (settings.getMax_active() != null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "'Max_active' field not allowed");
        if (settings.getMax_available() != null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "'Max_available' field not allowed");


        try{
            if (file ==null || file.isEmpty())
                vmservice.updateVM(id,settings);
            else
                vmservice.updateVM(id,file,settings);
        } catch(VMInstanceNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        } catch(TeamAuthorizationException e){
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,e.getMessage());
        } catch(UnavailableResourcesForTeamException | VMAlreadyInExecutionException | ImageException e){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,e.getMessage());
        }
    }

    // Only the owner of the team can stop it
    @GetMapping("{id}/stop")
    void stopVM(@PathVariable Long id){
        try{
            vmservice.stopVM(id);
        } catch(VMInstanceNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        } catch(TeamAuthorizationException e){
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,e.getMessage());
        } catch(UnavailableResourcesForTeamException | VMAlreadyInExecutionException e){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,e.getMessage());
        }
    }

    // a vm's owner can remove it
    @DeleteMapping("{id}")
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

    // an owner can share this role tih all the other team members
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


    /*****************************************************************************
     *
     ******************* VM INSTANCES: getters ***********************************
     *
     *****************************************************************************/

    @GetMapping("/{id}")
    VMDTO getVM(@PathVariable Long id){
        try{
            return ModelHelper.enrich(vmservice.getVM(id));
        }catch (TeamServiceException e){
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

    @GetMapping("/teams/{team_id}/resources")
    SettingsDTO getResourcesByTeam(@PathVariable Long team_id){
        try {
            return vmservice.getResourcesByTeam(team_id);
        }
        catch(TeamNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }
    }

    @GetMapping("/teams/{team_id}/resources/running")
    SettingsDTO getRunningResourcesByTeam(@PathVariable Long team_id){
        try {
            return vmservice.getRunningResourcesByTeam(team_id);
        }
        catch(TeamNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }
    }

    @GetMapping({"","/"})
    List<VMDTO> getVMs(){
            return vmservice.getVMs();
    }

    @GetMapping("/courses/{course_name}")
    List<VMDTO> getVMsByCourse(@PathVariable String course_name){
        try {
            return vmservice.getVMsByCourse(course_name);
        }
        catch(CourseNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }catch(AuthorizationServiceException e){
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,e.getMessage());
        }
    }

}
