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

    @OneToMany(mappedBy="professor",cascade = CascadeType.ALL, orphanRemoval = true)
    List<Course> courses =  new ArrayList<>();

    public void addCourse(Course c){
        courses.add(c);
        c.setProfessor(this);
    }

    public void removeCourse(Course c){
        courses.remove(c);
        c.setProfessor(null);
    }

}
