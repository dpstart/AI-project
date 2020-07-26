package it.polito.ai.esercitazione2.repositories;

import it.polito.ai.esercitazione2.entities.ConfirmAccount;
import it.polito.ai.esercitazione2.entities.Token;
import org.springframework.data.jpa.repository.JpaRepository;

import java.sql.Timestamp;
import java.util.List;

public interface ConfirmAccountRepository extends JpaRepository<ConfirmAccount,String> {

    List<ConfirmAccount> findAllByExpiryDateBefore(Timestamp t);
}
