package it.polito.ai.esercitazione2.repositories;

import it.polito.ai.esercitazione2.entities.Image;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ImageRepository extends JpaRepository<Image, Long> {
}

