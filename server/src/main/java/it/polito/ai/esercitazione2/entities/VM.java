package it.polito.ai.esercitazione2.entities;

import lombok.Data;

import javax.persistence.*;
import java.util.*;

@Entity
@Data
public class VM {

    @Id
    @GeneratedValue
    Long id;
    int n_cpu;
    int disk_space;
    int ram;
    int status; //valutare se mettere enum;   0: spenta, 1:attiva

    Long imageId;

    String id_creator;


    @ManyToMany(cascade={CascadeType.PERSIST,CascadeType.MERGE})
    @JoinTable(name="VM_owner",joinColumns = @JoinColumn(name="VM_id"),inverseJoinColumns = @JoinColumn(name="student_id"))
    List<Student> owners= new ArrayList<>();


    @ManyToOne
    @JoinColumn(name="team_id")
    Team team;


    public void addOwner(Student s){
        owners.add(s);
        s.getVMs().add(this);
        //System.out.println("here");
    }

    public void removeOwner(Student s){
        owners.remove(s);
        s.getVMs().remove(this);
    }

    public void setTeam(Team t){
        if (this.team!=t)
            this.team = t;

        if (!t.getVMs().contains(this))
            t.getVMs().add(this);

    }
}
