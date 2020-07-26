package it.polito.ai.esercitazione2.entities;

import lombok.Data;

import javax.persistence.Entity;
import javax.persistence.Id;
import java.sql.Timestamp;

@Entity
@Data
public class ConfirmAccount {
    @Id
    String id;
    String userId;
    Timestamp expiryDate;
}
