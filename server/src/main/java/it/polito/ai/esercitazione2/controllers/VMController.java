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


    @GetMapping("/{id}")
    VMDTO getVM(@PathVariable Long id){
        try{
            return ModelHelper.enrich(vmservice.getVM(id));
        }catch (TeamServiceException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }
    }

    @GetMapping("/{id}/connect")
    Image connectToVM(@PathVariable Long id){
        try{
            return vmservice.connectToVM(id);
        }catch (CourseNotEnabledException e){
            throw new ResponseStatusException(HttpStatus.PRECONDITION_REQUIRED,e.getMessage());
        }
        catch(OffMachineException e){
            throw new ResponseStatusException(HttpStatus.PRECONDITION_REQUIRED,e.getMessage());
        }
        catch(TeamServiceException e){
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

    @GetMapping("/{id}/update")
    void updateVM(@PathVariable Long id,@RequestPart(value="image",required=false) MultipartFile file, @Valid @RequestPart("settings") SettingsDTO settings){
        try{
            if (file ==null || file.isEmpty())
                vmservice.updateVM(id,settings);
            else
                vmservice.updateVM(id,file,settings);
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
