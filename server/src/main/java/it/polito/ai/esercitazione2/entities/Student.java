package it.polito.ai.esercitazione2.entities;


import lombok.Data;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;


@Entity
@Data
public class Student {
    @Id
    String id;
    String name;
    String firstName;

    @ManyToMany(cascade={CascadeType.PERSIST,CascadeType.MERGE})
    @JoinTable(name="student_course",joinColumns = @JoinColumn(name="student_id"),inverseJoinColumns = @JoinColumn(name="course_name"))
    List<Course> courses = new ArrayList<>();

    @ManyToMany(mappedBy="members")
    List<Team> teams = new ArrayList<>();

    public void addCourse(Course c){
        courses.add(c);
        c.getStudents().add(this);
    }

    public void addTeam(Team t){
        teams.add(t);
        t.getMembers().add(this);
    }

    public void removeTeam(Team t) {
        t.getMembers().remove(this);
        teams.remove(t);
    }
}
