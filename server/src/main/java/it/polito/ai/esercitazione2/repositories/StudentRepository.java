package it.polito.ai.esercitazione2.repositories;

import it.polito.ai.esercitazione2.entities.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StudentRepository extends JpaRepository<Student,String> {

}
