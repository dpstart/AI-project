package it.polito.ai.esercitazione2.services;

import it.polito.ai.esercitazione2.dtos.HomeworkDTO;
import it.polito.ai.esercitazione2.entities.Image;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.multipart.MultipartFile;

public interface HomeworkService {

    @PreAuthorize("hasRole('STUDENT')")
    void uploadHomework(Integer assignmentId, MultipartFile file);
    @PreAuthorize("hasRole('PROFESSOR') or hasRole('STUDENT')")
    HomeworkDTO getHomework(Integer id);

    @PreAuthorize("hasRole('PROFESSOR') or hasRole('STUDENT')")
    Image getImage(HomeworkDTO homework);
    @PreAuthorize("hasRole('PROFESSOR') or hasRole('STUDENT')")
    Image getImage(HomeworkDTO homework, int version);

    

}
