package it.polito.ai.esercitazione2.repositories;

import it.polito.ai.esercitazione2.entities.Token;
import org.springframework.data.jpa.repository.JpaRepository;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

public interface TokenRepository extends JpaRepository<Token,String> {

    List<Token> findAllByExpiryDateBefore(Timestamp t);
    List<Token>findAllByTeamId(Long teamId); //per selezionare quelli legati ad un team
    Optional<Token> findByUserIdAndTeamId(String userID, Long teamID); //per selezionare quelli legati ad un team


}
