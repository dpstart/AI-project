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
    String image_id;
    Boolean enabled=false;

    @ManyToMany(mappedBy="professors")
    List<Course> courses =  new ArrayList<>();
    @OneToMany(mappedBy = "professor")
    List<Assignment> assignments = new ArrayList<>();

    public void addCourse(Course c){
        courses.add(c);
        c.getProfessors().add(this);
    }

    public void removeCourse(Course c){
        courses.remove(c);
        c.getProfessors().remove(this);
    }

    public void addAssignment(Assignment a){
        assignments.add(a);
        a.setProfessor(this);
    }

    public void removeAssignment(Assignment a){
        assignments.remove(a);
        a.setProfessor(null);
    }

}
