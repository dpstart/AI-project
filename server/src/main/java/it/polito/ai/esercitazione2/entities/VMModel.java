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
    List<Team> teams = new ArrayList<>();
    // TO DO: add other attributes

    public void addTeam(Team t){
        teams.add(t);
        t.setVm_model(this);

    }

    public void removeStudent(Team t){
        teams.removeIf(x->x.getId().equals(t.getId()));
        t.setVm_model(null);
    }
}
