package it.polito.ai.esercitazione2.services;

import it.polito.ai.esercitazione2.dtos.ImageDTO;
import it.polito.ai.esercitazione2.dtos.SettingsDTO;
import it.polito.ai.esercitazione2.dtos.VMDTO;
import it.polito.ai.esercitazione2.dtos.VMModelDTO;
import it.polito.ai.esercitazione2.entities.Image;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface VMService {

    List<VMModelDTO> getVMModels();
    VMModelDTO getVMModel(String modelName);


    @PreAuthorize("hasRole('ADMIN')")
    boolean createVMModel(String modelName);
    @PreAuthorize("hasRole('ADMIN')")
    boolean removeVMModel(String modelName);

    @PreAuthorize("hasRole('PROFESSOR')")
    void defineVMModel(String teamID,String modelName);


    //TO DO: definrie autorizzazioni; per ora tutti posssono visualizzare i dettagli sulle risorse delle VM rpesenti
    VMDTO getVM(Long teamID);
    List<VMDTO> getVMByTeam(Long teamID);
    SettingsDTO getResourcesByTeam(Long teamID);
    SettingsDTO getRunningResourcesByTeam(Long teamID);

    List<VMDTO> getVMs();
    @PreAuthorize("hasRole('PROFESSOR')")
    List<VMDTO> getVMsByCourse(String name);


    @PreAuthorize("hasRole('STUDENT')")
    VMDTO createVM(String courseName,Long teamID, MultipartFile file, SettingsDTO settings);
    @PreAuthorize("hasRole('STUDENT')")
    void runVM(Long VMID);
    @PreAuthorize("hasRole('STUDENT')")
    void updateVM(Long vmID, MultipartFile file, SettingsDTO settings);
    @PreAuthorize("hasRole('STUDENT')")
    void updateVM(Long vmID, SettingsDTO settings);
    @PreAuthorize("hasRole('STUDENT')")
    void stopVM(Long VMID);
    @PreAuthorize("hasRole('STUDENT')")
    void removeVM(Long VMID);
    @PreAuthorize("hasRole('PROFESSOR') or hasRole('STUDENT')")
    ImageDTO connectToVM(Long VMID);

    @PreAuthorize("hasRole('STUDENT')")
    void shareOwnership(Long id, String studentId);
}
