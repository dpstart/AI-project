package it.polito.ai.esercitazione2.services;

import it.polito.ai.esercitazione2.dtos.ImageDTO;
import it.polito.ai.esercitazione2.dtos.SettingsDTO;
import it.polito.ai.esercitazione2.dtos.VMDTO;
import it.polito.ai.esercitazione2.dtos.VMModelDTO;
import it.polito.ai.esercitazione2.entities.Image;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * The functions in this service are divided in:
 *             * VM models;
 *             * VM instances: operation;
 *             * VM instances: getters;
 */

public interface VMService {

    /*****************************************************************************
     *
     ******************************* VM MODELS ***********************************
     *
     *****************************************************************************/

    // the admin creates a vmm model
    @PreAuthorize("hasRole('ADMIN')")
    // the admin removes the specified vmmmodel
    boolean createVMModel(String modelName);

    @PreAuthorize("hasRole('ADMIN')")
    boolean removeVMModel(String modelName);

    // get the list of VM models
    List<VMModelDTO> getVMModels();
    // get the VM model
    VMModelDTO getVMModel(String modelName);

    // associate a VM model for a course
    @PreAuthorize("hasRole('PROFESSOR')")
    void defineVMModel(String teamID,String modelName);


    /*****************************************************************************
     *
     ******************* VM INSTANCES: operation  ********************************
     *
     *****************************************************************************/

    // create a VM instance
    @PreAuthorize("hasRole('STUDENT')")
    VMDTO createVM(String courseName,Long teamID, MultipartFile file, SettingsDTO settings);

    // only a student owner of the VM can run it, if the associated course is enabled
    @PreAuthorize("hasRole('STUDENT')")
    void runVM(Long VMID);
    // a student of the team or the professor of the course can connect to a VM
    @PreAuthorize("hasRole('PROFESSOR') or hasRole('STUDENT')")
    ImageDTO connectToVM(Long VMID);
    // a VM's owner can update it
    @PreAuthorize("hasRole('STUDENT')")
    void updateVM(Long vmID, MultipartFile file, SettingsDTO settings);
    @PreAuthorize("hasRole('STUDENT')")
    // Only the owner of the team can update it
    void updateVM(Long vmID, SettingsDTO settings);
    // Only the owner of the team can stop it
    @PreAuthorize("hasRole('STUDENT')")
    void stopVM(Long VMID);

    // an owner can remove the VM
    @PreAuthorize("hasRole('STUDENT')")
    void removeVM(Long VMID);

    // an owner can share this role tih all the other team members
    @PreAuthorize("hasRole('STUDENT')")
    void shareOwnership(Long id, String studentId);

    /*****************************************************************************
     *
     ********************* VM INSTANCES: getters  ********************************
     *
     *****************************************************************************/

     //TO DO: definrie autorizzazioni; per ora tutti posssono visualizzare i dettagli sulle risorse delle VM rpesenti
     VMDTO getVM(Long teamID);
     List<VMDTO> getVMByTeam(Long teamID);
     SettingsDTO getResourcesByTeam(Long teamID);
     SettingsDTO getRunningResourcesByTeam(Long teamID);

     List<VMDTO> getVMs();
     @PreAuthorize("hasRole('PROFESSOR')")
     List<VMDTO> getVMsByCourse(String name);






}
