package it.polito.ai.esercitazione2.entities;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.io.Serializable;

@Data
@AllArgsConstructor
public class HomeworkId implements Serializable {
    Student student;
    Assignment assignment;
}
