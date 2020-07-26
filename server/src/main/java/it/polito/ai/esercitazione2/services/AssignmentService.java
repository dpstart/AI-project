package it.polito.ai.esercitazione2.services;

import it.polito.ai.esercitazione2.dtos.AssignmentDTO;
import it.polito.ai.esercitazione2.entities.Image;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface AssignmentService {

    @PreAuthorize("hasRole('PROFESSOR')")
    boolean addAssignment(AssignmentDTO a, MultipartFile file, String courseId);
    @PreAuthorize("hasRole('PROFESSOR')")
    boolean removeAssignment(Integer id);
    AssignmentDTO getAssignment(Integer id);
    @PreAuthorize("hasRole('ADMIN')")
    List<AssignmentDTO> getAllAssignments();
    List<AssignmentDTO> getByCourse(String courseId);
    List<AssignmentDTO> getByProfessor(String professorId);
    List<AssignmentDTO> getByStudent(String studentId);
    Image getImage(AssignmentDTO assignment);
}
