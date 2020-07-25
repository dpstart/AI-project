package it.polito.ai.esercitazione2.repositories;

import it.polito.ai.esercitazione2.entities.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Integer> {
    @Query("SELECT a FROM Assignment a WHERE a.course.name=:courseName")
    List<Assignment> getAssignmentsForCourse(String courseName);
    @Query("SELECT a FROM Assignment a WHERE a.professor.id=:professorId")
    List<Assignment> getAssignmentsForProfessor(String professorId);
}
