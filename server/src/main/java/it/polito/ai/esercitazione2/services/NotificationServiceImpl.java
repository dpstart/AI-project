package it.polito.ai.esercitazione2.services;

import it.polito.ai.esercitazione2.dtos.ProfessorDTO;
import it.polito.ai.esercitazione2.dtos.StudentDTO;
import it.polito.ai.esercitazione2.dtos.TeamDTO;

import it.polito.ai.esercitazione2.entities.Token;
import it.polito.ai.esercitazione2.exceptions.ExpiredTokenException;
import it.polito.ai.esercitazione2.exceptions.TeamNotFoundException;
import it.polito.ai.esercitazione2.exceptions.TokenNotFoundException;
import it.polito.ai.esercitazione2.repositories.TokenRepository;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;

import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.sql.Timestamp;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(dontRollbackOn = TeamNotFoundException.class)
@Log(topic = "Notification Service")
public class NotificationServiceImpl implements NotificationService {

    @Autowired
    public JavaMailSender emailSender;
    @Autowired
    public TokenRepository tokenRepository;
    @Autowired
    public TeamService teamService;

    @Autowired
    @Qualifier("templateConfirmRejectMessage")
    public SimpleMailMessage template;

    @Autowired
    @Qualifier("templatePasswordMessage")
    public SimpleMailMessage pwd_template;

    @Override
    @Async
    public void sendMessage(String address, String subject, String body) {

        SimpleMailMessage message = new SimpleMailMessage();
        //message.setTo(address);
        message.setTo("s257649@studenti.polito.it");
        message.setSubject(subject);
        message.setText(body);
        try {
            emailSender.send(message);
        }
        catch (MailException e){
            //si può gestire meglio
            log.severe("Some problems occur with the mail sending ");
        }

    }

    @Override
    public boolean confirm(String token) {
        Timestamp today = new Timestamp(System.currentTimeMillis());
        Optional<Token> t=tokenRepository.findById(token);
        if (!t.isPresent())
            throw new TokenNotFoundException("Specified token not found");
        Token to = t.get();

        if (to.getExpiryDate().before(today))
            throw new ExpiredTokenException("Expired token");

        tokenRepository.deleteById(token);



        if (!teamService.activeTeam(to.getTeamId()))
            throw new TeamNotFoundException("Team associated with this token doesn't exist anymore");

        List<Token> lt=tokenRepository.findAllByTeamId(to.getTeamId());
        if  (lt.size()>0)
            return  false;



        return true;
    }

    @Override
    public boolean reject(String token) {
        Timestamp today = new Timestamp(System.currentTimeMillis());
        Optional<Token> t=tokenRepository.findById(token);
        if (!t.isPresent())
            throw new TokenNotFoundException("Specified token not found");

        Token to = t.get();
        if (to.getExpiryDate().before(today))
            throw new ExpiredTokenException("Expired token");

        tokenRepository.deleteById(token);
        tokenRepository.deleteAll(tokenRepository.findAllByTeamId(to.getTeamId()));

        if (!teamService.evictTeam(to.getTeamId()))
            throw new TeamNotFoundException("Team associated with this token doesn't exist anymore");

        return true;
    }

    @Override
    @Async
    public void notifyTeam(TeamDTO dto, List<String> memberIds){
        Timestamp expiryDate =  new Timestamp(System.currentTimeMillis()+(60 * 60 * 1000));
        for(String s: memberIds){
            String token = UUID.randomUUID().toString();
            Token t = new Token();
            t.setId(token);
            t.setTeamId(dto.getId());
            t.setExpiryDate(expiryDate);
            tokenRepository.save(t);
            String body = String.format(template.getText(), "http://localhost:8080/notification/confirm/"+token,"http://localhost:8080/notification/reject/"+token);
            sendMessage("s"+s+"@studenti.polito.it","Invitation to join team: "+dto.getName(),body);
        }
    }

    @Override
    @Async
    public void notifyStudent(StudentDTO s,String pwd) {
        String body = String.format(pwd_template.getText(), s.getName(),pwd);
        sendMessage("s"+s.getId()+"@studenti.polito.it","Welcome on AI platform",body);
    }

    @Override
    @Async
    public void notifyProfessor(ProfessorDTO p, String pwd) {
        String body = String.format(pwd_template.getText(), "Professor "+p.getName()+ "  "+p.getFirstName(),pwd);
        sendMessage("s"+p.getId()+"@polito.it","Welcome on AI platform",body);
    }

    @Scheduled(initialDelay = 60*60*1000, fixedRate = 10*60*60*1000)
    public void run() {
        Timestamp now = new Timestamp(System.currentTimeMillis());
        List<Token> expired = tokenRepository.findAllByExpiryDateBefore(now);
        Set<Long> teams = expired.stream().map(x->x.getTeamId()).collect(Collectors.toSet());
        tokenRepository.deleteAll(expired);
        teams.stream().forEach(x->tokenRepository.deleteAll(tokenRepository.findAllByTeamId(x)));
        teamService.evictAll(teams);   // posso riportare eventualmente qualki team erano già stati cancellatio prima della scadenza del token
    }
}
