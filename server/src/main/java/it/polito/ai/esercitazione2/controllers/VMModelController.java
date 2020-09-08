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

    /**
     * Authentication required: Any role
     * INPUT: none
     * @return lista di VMModel
     */
    @GetMapping({"","/"})
    List<VMModelDTO> getVMModels(){
        return vmservice.getVMModels();
    }

    /**
     * Authentication required: Any role
     * INPUT: path variable
     * @return VMModel
     */
    @GetMapping("/{name}")
    VMModelDTO getVMModel(@PathVariable String name){
        return ModelHelper.enrich(vmservice.getVMModel(name));
    }


    /**
     * Creation of a VMModel
     * Authentication required: Admin
     * INPUT: {
     *          "name": "macOS High Sierra"
     *        }
     * @return void
     */

    @PostMapping({"","/"})
    @ResponseStatus(HttpStatus.OK)
    void createVMModel(@RequestBody Map<String,String> modelName){

        if (!modelName.containsKey("name") || modelName.keySet().size()>1){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Expected one parameter: usage 'name':<modelName>");
        }
        if (!vmservice.createVMModel(modelName.get("name")))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "already existing VM Model");
    }


    /**
     * Removal of a VMModel
     * Authentication required: Admin
     * INPUT: path variable
     * @return boolean (true: removed; false: not removed)
     */

    @GetMapping("/{name}/remove")
    boolean removeVMModel(@PathVariable String name){
        try {
            return vmservice.removeVMModel(name);
        }catch (IncoherenceException e){
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }
    }


}
