package it.polito.ai.esercitazione2.entities;

import lombok.Data;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;


@Entity
@Data
public class Team {

    @Id
    @GeneratedValue
    Long id;
    String name;
    int status;

    int n_cpu;
    long disk_space;
    long ram;
    int max_active;
    int max_available;

    @ManyToOne
    @JoinColumn(name="course_id")
    Course course;

    @ManyToMany(cascade={CascadeType.PERSIST,CascadeType.MERGE})
    @JoinTable(name="team_student",joinColumns = @JoinColumn(name="team_id"),inverseJoinColumns = @JoinColumn(name="student_id"))
    List<Student> members = new ArrayList<>();

    @OneToMany(mappedBy="team",cascade = CascadeType.ALL, orphanRemoval = true)
    List<VM> VMs = new ArrayList<>();


    String id_creator;

    public void setCourse(Course c){
        if (course != null) {

            if (c!=null && course.equals(c.getName())) {
                return;
            }
            course.getTeams().remove(this);
        }

        if (c!=null && !c.getTeams().contains(this)){
             c.getTeams().add(this);
        }
        course=c;
    }

    public void addStudent(Student t){
        members.add(t);
        t.getTeams().add(this);

    }

    public void removeStudent(Student t){
        members.removeIf(x->x.getId().equals(t.getId()));
        t.getTeams().remove(this);
    }

    public void addVM(VM vm){
        this.VMs.add(vm);
        vm.setTeam(this);
    }




}
