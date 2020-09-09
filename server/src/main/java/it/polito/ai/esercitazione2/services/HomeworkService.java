package it.polito.ai.esercitazione2.services;

import it.polito.ai.esercitazione2.dtos.HomeworkDTO;
import it.polito.ai.esercitazione2.dtos.ImageDTO;
import it.polito.ai.esercitazione2.entities.Image;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.multipart.MultipartFile;

import java.sql.Timestamp;
import java.util.List;

@PreAuthorize("isAuthenticated()")
public interface HomeworkService {

    @PreAuthorize("hasRole('STUDENT')")
    HomeworkDTO uploadHomeworkReview(Integer assignmentId, MultipartFile file);
    @PreAuthorize("hasRole('PROFESSOR')")
    HomeworkDTO markHomework(HomeworkDTO dto);
    @PreAuthorize("hasRole('PROFESSOR')")
    HomeworkDTO uploadHomeworkReview(Integer assignmentId, Long homeworkId, MultipartFile file);
    HomeworkDTO getHomework(Long id);
    Integer getAssignmentId(Long homeworkId);
    ImageDTO getImage(Long homeworkId);
    ImageDTO getImage(Long homeworkId, int version);
    Timestamp getDeliveryDate(Long homeworkId, int version);
    List<ImageDTO> getAllImages(Long homeworkId);
    String getHomeworkStudentId(Long homeworkId);
    String getHomeworkCourse(Long homeworkId);
}
