package it.polito.ai.esercitazione2.repositories;

import it.polito.ai.esercitazione2.entities.Assignment;
import it.polito.ai.esercitazione2.entities.Homework;
import it.polito.ai.esercitazione2.entities.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface HomeworkRepository extends JpaRepository<Homework, Integer> {
    @Query("SELECT h FROM Homework h WHERE h.assignment=:assignment")
    List<Homework> getHomeworkByAssignment(Assignment assignment);
    @Query("SELECT h FROM Homework h WHERE h.student=:student")
    List<Homework> getHomeworkByStudent(Student student);
}
