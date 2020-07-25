package it.polito.ai.esercitazione2.entities;


import lombok.Data;
import lombok.NonNull;

import javax.persistence.*;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
public class Assignment {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    Integer number;

    @Id
    @JoinColumn(name="course_id")
    @ManyToOne
    Course course;

    @ManyToOne
    @JoinColumn(name="professor_id")
    Professor professor;
    Timestamp releaseDate;
    Timestamp expirationDate;
    String contentId;

    @OneToMany(mappedBy="assignment")
    List<Homework> homeworks =  new ArrayList<>();

    public Assignment(@NonNull Course course,
                      @NonNull Professor professor,
                      @NonNull Timestamp releaseDate,
                      @NonNull Timestamp expirationDate,
                      @NonNull String contentId){
        this.setCourse(course);
        this.setProfessor(professor);
        this.releaseDate=releaseDate;
        this.expirationDate=expirationDate;
        this.contentId=contentId;
    }

    public void setCourse(@NonNull Course course){
        this.course=course;
        this.course.getAssignments().add(this);
    }

    public void setProfessor(@NonNull Professor professor){
        this.professor=professor;
        this.professor.getAssignments().add(this);
    }

    public void addHomework(@NonNull Homework homework){
        this.homeworks.add(homework);
    }

    public void removeHomework(@NonNull Homework homework){
        this.homeworks.remove(homework);
    }
}
