package it.polito.ai.esercitazione2.entities;

import it.polito.ai.esercitazione2.exceptions.HomeworkIsNotFinalException;
import it.polito.ai.esercitazione2.exceptions.IllegalHomeworkStateChangeException;
import lombok.Data;
import lombok.NonNull;

import javax.persistence.*;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
public class Homework {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    Integer id;

    @ManyToOne
    @JoinColumn(name="student_id")
    Student student;

    @ManyToOne
    @JoinColumn(name="assignment_id")
    Assignment assignment;

    @ElementCollection
    List<String> versionIds = new ArrayList<>();
    @ElementCollection
    List<Timestamp> versionDates = new ArrayList<>();

    public static enum states {
        unread,
        read,
        delivered,
        reviewed;
    }

    Homework.states state = states.unread;
    Boolean isFinal = false;
    Float mark = 0f;

    public void setStudent(@NonNull Student s){
        this.student=student;
        this.student.addHomework(this);
    }

    public void setAssignment(@NonNull Assignment a){
        this.assignment=assignment;
        this.assignment.addHomework(this);
    }

    public void setMark(@NonNull Float mark){
        if (!this.isFinal)
            throw new HomeworkIsNotFinalException("Homework must be flagged as final to assign a mark to it");
        this.mark=mark;
    }

    public void setState(@NonNull Homework.states state){
        if(this.isFinal)
            throw new IllegalHomeworkStateChangeException("Can't change state of an Homework flagged as final");
        if(state.compareTo(this.state)!=1 //only go ahead through states
                && (this.state.equals(states.reviewed) //unless it is reviewed and students wants to re-deliver
                    && state.compareTo(this.state)!=-1)){
            throw new IllegalHomeworkStateChangeException("States can only go ahead and by one step, unless when going from reviewed to delivered");
        }
        this.state=state;
    }

}
