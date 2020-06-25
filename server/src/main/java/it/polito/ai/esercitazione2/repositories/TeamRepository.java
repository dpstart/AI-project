package it.polito.ai.esercitazione2.repositories;

import it.polito.ai.esercitazione2.entities.Course;
import it.polito.ai.esercitazione2.entities.Team;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamRepository extends JpaRepository<Team,Long> {

    List<Team> getByCourse(Course c);
}
