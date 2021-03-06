package it.polito.ai.esercitazione2.entities;


import lombok.Data;
import lombok.NonNull;

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
    @Column(unique=true)
    String alias;
    String email;
    Long image_id;
    Boolean enabled=false;


    @ManyToMany(mappedBy = "students")
    List<Course> courses = new ArrayList<>();

    @ManyToMany(mappedBy="members")
    List<Team> teams = new ArrayList<>();

    @ManyToMany(mappedBy="owners")
    List<VM> VMs = new ArrayList<>();

    @OneToMany(mappedBy="student")
    List<Homework> homeworks =  new ArrayList<>();

    public void addCourse(Course c){
        courses.add(c);
        c.getStudents().add(this);
    }

    public void removeCourse(Course c){
        courses.remove(c);
        c.getStudents().remove(this);
    }

    public void addTeam(Team t){
        teams.add(t);
        t.getMembers().add(this);
    }

    public void removeTeam(Team t) {
        t.getMembers().remove(this);
        teams.remove(t);
    }

    public void addVM(VM v){
        VMs.add(v);
        v.getOwners().add(this);
    }

    public void removeVM(VM v){
        VMs.remove(v);
        v.getOwners().remove(this);
    }

    public void addHomework(@NonNull Homework homework){
        this.homeworks.add(homework);
    }

    public void removeHomework(@NonNull Homework homework){
        this.homeworks.remove(homework);
    }
}
