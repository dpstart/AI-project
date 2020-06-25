package it.polito.ai.esercitazione2.entities;

import lombok.Data;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
public class Course {
    @Id
    String name;
    int min;
    int max;
    Boolean enabled;


    @ManyToOne
    @JoinColumn(name="professor_id")
    Professor professor;

    @ManyToMany(mappedBy = "courses")
    List<Student> students = new ArrayList<>();
    @OneToMany(mappedBy="course",cascade = CascadeType.ALL, orphanRemoval = true)
    List<Team> teams =  new ArrayList<>();



    public void addStudent(Student s){
        students.add(s);
        s.getCourses().add(this);

    }

    public void addTeam(Team t){
       teams.add(t);
       t.setCourse(this);
    }

    public void removeTeam(Team t){
        teams.remove(t);
        t.setCourse(null);
    }



}
