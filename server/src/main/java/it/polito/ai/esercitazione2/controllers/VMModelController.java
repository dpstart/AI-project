package it.polito.ai.esercitazione2.controllers;

import it.polito.ai.esercitazione2.dtos.VMModelDTO;
import it.polito.ai.esercitazione2.exceptions.IncoherenceException;
import it.polito.ai.esercitazione2.exceptions.TeamServiceException;
import it.polito.ai.esercitazione2.services.TeamService;
import it.polito.ai.esercitazione2.services.VMService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AuthorizationServiceException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/API/models")
public class VMModelController {
    @Autowired
    TeamService teamservice;

    @Autowired
    VMService vmservice;

    @GetMapping("/")
    List<VMModelDTO> getVMModels(){
        return vmservice.getVMModels();
    }

    @GetMapping("/{name}")
    VMModelDTO getVMModel(@PathVariable String name){
        return ModelHelper.enrich(vmservice.getVMModel(name));
    }

    @GetMapping("/{name}")
    boolean removeVMModel(@PathVariable String name){
        try {
            return vmservice.removeVMModel(name);
        }catch (IncoherenceException e){
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }
    }

    @PostMapping("/")
    @ResponseStatus(HttpStatus.OK)
    void createVMModel(@RequestBody Map<String,String> modelName){
        if (!modelName.containsKey("name") || modelName.keySet().size()>1){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Expected one parameter: usage 'name':<modelName>");
        }
        if (!vmservice.createVMModel(modelName.get("name")))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "already existing VM Model");
    }

    @PostMapping("/{id}/model")  // ragionare su se è più logico accedere direttamente a qualuenue team perdendo il riferimento al corso oppure /APU/courses/PDS/{teamID}
    void defineVMmodelForACourse(@PathVariable String id, @RequestBody Map<String,String> input){
        if (!input.containsKey("model") || input.keySet().size()>1){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Expected one parameter: usage 'model':<modelName>");
        }

        try{
            vmservice.defineVMModel(id,input.get("model"));
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
}
