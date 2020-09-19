package it.polito.ai.esercitazione2.repositories;

import it.polito.ai.esercitazione2.entities.Professor;

import it.polito.ai.esercitazione2.entities.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProfessorRepository extends JpaRepository<Professor,String> {
    Professor getByAlias(String alias);

    @Query("SELECT p1 FROM Professor p1 WHERE p1.id NOT IN (" +
            "SELECT p.id FROM Professor p INNER JOIN p.courses c WHERE (c.name=:courseName OR c.acronime=:courseName))")
    List<Professor> getProfessorNotInCourse(String courseName);
}
