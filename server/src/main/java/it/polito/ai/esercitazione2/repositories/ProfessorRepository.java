package it.polito.ai.esercitazione2.repositories;

import it.polito.ai.esercitazione2.entities.Professor;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfessorRepository extends JpaRepository<Professor,String> {
}
