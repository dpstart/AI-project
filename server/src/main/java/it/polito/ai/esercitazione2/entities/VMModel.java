package it.polito.ai.esercitazione2.entities;

import lombok.Data;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table
@Data
public class VMModel {
    @Id
    String name;

    @OneToMany(mappedBy="vm_model",cascade = CascadeType.ALL, orphanRemoval = true)
    List<Course> courses = new ArrayList<>();

    public void addCourse(Course c){
        courses.add(c);
        c.setVm_model(this);

    }

    public void removeStudent(Course c){
        courses.removeIf(x->x.getName().equals(c.getName()));
        c.setVm_model(null);
    }
}
