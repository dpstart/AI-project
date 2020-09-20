package it.polito.ai.esercitazione2.services;

import it.polito.ai.esercitazione2.dtos.ProfessorDTO;
import it.polito.ai.esercitazione2.dtos.StudentDTO;
import it.polito.ai.esercitazione2.dtos.TeamDTO;

import java.util.List;
import java.util.Map;

public interface NotificationService {

    // base method to send the email
    void sendMessage(String address, String subject, String body);

    // confirm the partecipation to a team
    boolean confirm(String token);

    // confirm the removal of a team
    boolean reject(String token);

    // notify the members
    void notifyTeam(String team, Map<String,String> tokens);

    // create team token
    Map<String,String> generateTokens(Long team, List<String> tokens,Long duration);

    // send activation link to student
    void notifyStudent(StudentDTO s);
    // send activation link to professor
    void notifyProfessor(ProfessorDTO p);
    // activate user
    boolean activate(String token);





}
