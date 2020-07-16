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
    @Column(unique=true)
    String acronime;
    int min;
    int max;
    Boolean enabled;


    @ManyToMany(cascade={CascadeType.PERSIST,CascadeType.MERGE})
    @JoinTable(name="course_professor",joinColumns = @JoinColumn(name="course_name"),inverseJoinColumns = @JoinColumn(name="professor_id"))
    List<Professor> professors = new ArrayList<>();

    @ManyToMany(mappedBy = "courses")
    List<Student> students = new ArrayList<>();
    @OneToMany(mappedBy="course",cascade = CascadeType.ALL, orphanRemoval = true)
    List<Team> teams =  new ArrayList<>();



    public void addStudent(Student s){
        students.add(s);
        s.getCourses().add(this);

    }

    public void addProfessor(Professor p){
        professors.add(p);
        p.getCourses().add(this);

    }
    public void removeProfessor(Professor p){
        professors.remove(p);
        p.getCourses().remove(this);

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
