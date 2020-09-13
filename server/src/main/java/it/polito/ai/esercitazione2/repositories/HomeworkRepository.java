package it.polito.ai.esercitazione2.repositories;

import it.polito.ai.esercitazione2.entities.Assignment;
import it.polito.ai.esercitazione2.entities.Homework;
import it.polito.ai.esercitazione2.entities.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface HomeworkRepository extends JpaRepository<Homework, Long> {
    Homework getById(Long id);
    @Query("SELECT h FROM Homework h WHERE h.assignment.id=:assignmentId")
    List<Homework> getHomeworksByAssignment(Integer assignmentId);
    @Query("SELECT h FROM Homework h WHERE h.student.id=:studentId")
    List<Homework> getHomeworksByStudent(String studentId);

//    Homework getHomeworkByStudentIdAndAssignmentId(String studentId, Integer assignmentId);

    Homework getHomeworkByStudentAndAssignment(Student student, Assignment assignment);
}
