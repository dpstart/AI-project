package it.polito.ai.esercitazione2.services;

import it.polito.ai.esercitazione2.dtos.ProfessorDTO;
import it.polito.ai.esercitazione2.dtos.StudentDTO;
import it.polito.ai.esercitazione2.dtos.TeamDTO;

import java.util.List;

public interface NotificationService {
    void sendMessage(String address, String subject, String body);

    boolean confirm(String token);
    boolean reject(String token);
    void notifyTeam(TeamDTO dto, List<String> memberIds);
    void notifyStudent(StudentDTO s,String pwd);
    void notifyProfessor(ProfessorDTO s, String pwd);


}
