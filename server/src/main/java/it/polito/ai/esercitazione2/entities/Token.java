package it.polito.ai.esercitazione2.entities;

import lombok.Data;

import javax.persistence.Entity;
import javax.persistence.Id;
import java.sql.Timestamp;

@Data
@Entity
public class Token {
     @Id
     String id;
     Long teamId;
     String userId;
     Timestamp expiryDate;


}
