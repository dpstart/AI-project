package it.polito.ai.esercitazione2.services;

import it.polito.ai.esercitazione2.dtos.ProfessorDTO;
import it.polito.ai.esercitazione2.dtos.StudentDTO;
import it.polito.ai.esercitazione2.dtos.TeamDTO;

import java.util.List;

public interface NotificationService {

    // base method to send the email
    void sendMessage(String address, String subject, String body);

    // confirm the partecipation to a team
    boolean confirm(String token);

    // confirm the removal of a team
    boolean reject(String token);

    // create team token and notify the members
    void notifyTeam(TeamDTO dto, List<String> memberIds,Long duration);

    // send activation link to student
    void notifyStudent(StudentDTO s);
    // send activation link to professor
    void notifyProfessor(ProfessorDTO p);
    // activate user
    boolean activate(String token);





}
