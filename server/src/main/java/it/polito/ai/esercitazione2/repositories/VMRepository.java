package it.polito.ai.esercitazione2.repositories;

import it.polito.ai.esercitazione2.entities.Token;
import it.polito.ai.esercitazione2.entities.VM;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VMRepository extends JpaRepository<VM,String> {
}
