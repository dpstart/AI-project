package it.polito.ai.esercitazione2.repositories;

import it.polito.ai.esercitazione2.entities.VM;
import it.polito.ai.esercitazione2.entities.VMModel;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VMModelRepository extends JpaRepository<VMModel,String> {
}
