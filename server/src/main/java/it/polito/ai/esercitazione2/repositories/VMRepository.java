package it.polito.ai.esercitazione2.repositories;

import it.polito.ai.esercitazione2.entities.Course;
import it.polito.ai.esercitazione2.entities.Team;
import it.polito.ai.esercitazione2.entities.Token;
import it.polito.ai.esercitazione2.entities.VM;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VMRepository extends JpaRepository<VM,Long> {

    List<VM> getByTeam(Team t);
}
