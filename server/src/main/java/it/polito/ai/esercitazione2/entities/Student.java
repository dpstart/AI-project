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
    String email;
    String password;
    String image_id;

    @ManyToMany(cascade={CascadeType.PERSIST,CascadeType.MERGE})
    @JoinTable(name="student_course",joinColumns = @JoinColumn(name="student_id"),inverseJoinColumns = @JoinColumn(name="course_name"))
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
