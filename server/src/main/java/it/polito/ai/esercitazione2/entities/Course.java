package it.polito.ai.esercitazione2.entities;

import lombok.Data;
import lombok.NonNull;

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
    @OneToMany(mappedBy = "course",cascade = CascadeType.ALL, orphanRemoval = true)
    List<Assignment> assignments = new ArrayList<>();



    public void addStudent(@NonNull Student s){
        students.add(s);
        s.getCourses().add(this);

    }

    public void removeStudent(@NonNull Student s){
        students.remove(s);
        s.getCourses().remove(this);
    }

    public void addProfessor(@NonNull Professor p){
        professors.add(p);
        p.getCourses().add(this);

    }
    public void removeProfessor(@NonNull Professor p){
        professors.remove(p);
        p.getCourses().remove(this);

    }

    public void addTeam(@NonNull Team t){
       teams.add(t);
       t.setCourse(this);
    }

    public void removeTeam(@NonNull Team t){
        teams.remove(t);
        t.setCourse(null);
    }

    public void addAssignment(@NonNull Assignment a){
        assignments.add(a);
    }

    public void removeAssignment(@NonNull Assignment a){
        assignments.remove(a);
    }


}
