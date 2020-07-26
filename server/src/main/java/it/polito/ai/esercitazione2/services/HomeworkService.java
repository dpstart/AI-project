package it.polito.ai.esercitazione2.services;

import it.polito.ai.esercitazione2.dtos.HomeworkDTO;
import it.polito.ai.esercitazione2.entities.Image;
import org.springframework.web.multipart.MultipartFile;

public interface HomeworkService {

    void uploadHomework(Integer assignmentId, MultipartFile file);
    HomeworkDTO getHomework(Integer id);

    Image getImage(HomeworkDTO homework);
    Image getImage(HomeworkDTO homework, int version);

}
