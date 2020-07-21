package it.polito.ai.esercitazione2.entities;


import lombok.Data;

import javax.persistence.*;
import java.sql.Timestamp;

@Entity
@Data
@IdClass(AssignmentId.class)
public class Assignment {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    Integer number;

    @Id
    @JoinColumn(name="course_id")
    @ManyToOne
    Course course;

    @ManyToOne
    @JoinColumn(name="professor_id")
    Professor professor;

    Timestamp releaseDate;
    Timestamp expirationDate;

    String contentId;
}
