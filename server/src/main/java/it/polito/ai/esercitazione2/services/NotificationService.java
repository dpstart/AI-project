package it.polito.ai.esercitazione2.services;

import it.polito.ai.esercitazione2.dtos.ProfessorDTO;
import it.polito.ai.esercitazione2.dtos.StudentDTO;
import it.polito.ai.esercitazione2.dtos.TeamDTO;

import java.util.List;

public interface NotificationService {
    void sendMessage(String address, String subject, String body);

    boolean confirm(String token);

    boolean reject(String token);
    void notifyTeam(TeamDTO dto, List<String> memberIds,Long duration);

    void notifyStudent(StudentDTO s);
    void notifyProfessor(ProfessorDTO p);
    boolean activate(String token);


}
