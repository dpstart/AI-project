package it.polito.ai.esercitazione2.entities;

import lombok.Data;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
public class Professor {
    @Id
    String id;
    String name;
    String firstName;
    String email;

    @ManyToMany(mappedBy="professors")
    List<Course> courses =  new ArrayList<>();

    public void addCourse(Course c){
        courses.add(c);
        c.getProfessors().add(this);
    }

    public void removeCourse(Course c){
        courses.remove(c);
        c.getProfessors().remove(this);
    }

}
