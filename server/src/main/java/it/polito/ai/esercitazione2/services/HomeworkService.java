package it.polito.ai.esercitazione2.services;

import it.polito.ai.esercitazione2.dtos.HomeworkDTO;
import it.polito.ai.esercitazione2.entities.Image;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.multipart.MultipartFile;

import java.sql.Timestamp;
import java.util.List;

@PreAuthorize("isAuthenticated()")
public interface HomeworkService {

    @PreAuthorize("hasRole('STUDENT')")
    HomeworkDTO uploadHomework(Integer assignmentId, MultipartFile file);
    HomeworkDTO getHomework(Integer id);
    Integer getAssignmentId(Integer homeworkId);
    Image getImage(Integer homeworkId);
    Image getImage(Integer homeworkId, int version);
    Timestamp getDeliveryDate(Integer homeworkId, int version);
    List<Image> getAllImages(Integer homeworkId);
    String getHomeworkStudentId(Integer homeworkId);
    String getHomeworkCourse(Integer homeworkId);
}
