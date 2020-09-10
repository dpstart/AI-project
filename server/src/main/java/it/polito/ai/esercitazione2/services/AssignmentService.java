package it.polito.ai.esercitazione2.services;

import it.polito.ai.esercitazione2.dtos.AssignmentDTO;
import it.polito.ai.esercitazione2.dtos.HomeworkDTO;
import it.polito.ai.esercitazione2.dtos.ImageDTO;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@PreAuthorize("isAuthenticated()")
public interface AssignmentService {

    @PreAuthorize("hasRole('PROFESSOR')")
    AssignmentDTO addAssignment(AssignmentDTO a, MultipartFile file, String courseId);
    @PreAuthorize("hasRole('PROFESSOR')")
    boolean removeAssignment(Integer id);
    AssignmentDTO getAssignment(Integer id);
    String getAssignmentProfessor(Integer assignmentId);
    String getAssignmentCourse(Integer assignmentId);
    List<HomeworkDTO> getAssignmentHomeworks(Integer assignmentId);
    @PreAuthorize("hasRole('ADMIN')")
    List<AssignmentDTO> getAllAssignments();
    List<AssignmentDTO> getByCourse(String courseId);
    List<HomeworkDTO> getHomeworksByCourse(String courseId);
    List<AssignmentDTO> getByProfessor(String professorId);
    List<AssignmentDTO> getByStudent(String studentId);
    ImageDTO getImage(Integer assignmentId);
}
