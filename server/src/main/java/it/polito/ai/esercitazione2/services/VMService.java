package it.polito.ai.esercitazione2.services;

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

    @PreAuthorize("hasRole('STUDENT')")
    void defineVMModel(String teamID,String modelName);
    VMDTO createVM(Long teamID, MultipartFile file, SettingsDTO settings);
    VMDTO getVM(Long teamID);
    List<VMDTO> getVMByTeam(Long teamID);

    void runVM(Long VMID);
    void stopVM(Long VMID);
    void removeVM(Long VMID);
    @PreAuthorize("hasRole('PROFESSOR') or hasRole('STUDENT')")
    Image connectToVM(Long VMID);

    void shareOwnership(Long id, String studentId);
}
