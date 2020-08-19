package it.polito.ai.esercitazione2.services;

import it.polito.ai.esercitazione2.dtos.ProfessorDTO;
import it.polito.ai.esercitazione2.dtos.StudentDTO;
import it.polito.ai.esercitazione2.dtos.TeamDTO;

import it.polito.ai.esercitazione2.entities.ConfirmAccount;
import it.polito.ai.esercitazione2.entities.Token;
import it.polito.ai.esercitazione2.exceptions.ExpiredTokenException;
import it.polito.ai.esercitazione2.exceptions.TeamNotFoundException;
import it.polito.ai.esercitazione2.exceptions.TokenNotFoundException;
import it.polito.ai.esercitazione2.repositories.ConfirmAccountRepository;
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
    public ConfirmAccountRepository confirmAccountRepository;
    @Autowired
    public TeamService teamService;

    @Autowired
    @Qualifier("templateConfirmRejectMessage")
    public SimpleMailMessage template;

    @Autowired
    @Qualifier("templateActivationMessage")
    public SimpleMailMessage activation_template;

    @Override
    @Async
    public void sendMessage(String address, String subject, String body) {

        SimpleMailMessage message = new SimpleMailMessage();
        //message.setTo(address);
        message.setTo("s262829@studenti.polito.it");
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



        if (!teamService.activateTeam(to.getTeamId()))
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
    public void notifyTeam(TeamDTO dto, List<String> memberIds,Long expiration){
        Timestamp expiryDate =  new Timestamp(System.currentTimeMillis()+expiration);
        for(String s: memberIds){
            String token = UUID.randomUUID().toString();
            Token t = new Token();
            t.setId(token);
            t.setTeamId(dto.getId());
            t.setUserId(s);
            t.setExpiryDate(expiryDate);
            tokenRepository.save(t);
            String body = String.format(template.getText(), "http://localhost:8080/notification/confirm/"+token,"http://localhost:8080/notification/reject/"+token);
            //sendMessage("s"+s+"@studenti.polito.it","Invitation to join team: "+dto.getName(),body);
            sendMessage("giuseppe.pastore10@libero.it","Invitation to join team: "+dto.getName(),body);

        }
    }

    @Override
    @Async
    public void notifyStudent(StudentDTO s){
        Timestamp expiryDate =  new Timestamp(System.currentTimeMillis()+(60 * 60 * 1000));

        String token = UUID.randomUUID().toString();
        ConfirmAccount ca = new ConfirmAccount();
        ca.setId(token);
        ca.setUserId(s.getId());
        ca.setExpiryDate(expiryDate);
        confirmAccountRepository.save(ca);
        String body = String.format(activation_template.getText(), s.getName(),"http://localhost:8080/notification/activate/"+token);
       // sendMessage(s.getEmail(),"Activate your account",body);
        sendMessage("giuseppe.pastore10@libero.it","Activate your account",body);

    }
    @Override
    @Async
    public void notifyProfessor(ProfessorDTO s){
        Timestamp expiryDate =  new Timestamp(System.currentTimeMillis()+(60 * 60 * 1000));

        String token = UUID.randomUUID().toString();
        ConfirmAccount ca = new ConfirmAccount();
        ca.setId(token);
        ca.setUserId(s.getId());
        ca.setExpiryDate(expiryDate);
        confirmAccountRepository.save(ca);
        String body = String.format(activation_template.getText(), s.getName(),"http://localhost:8080/notification/activate/"+token);
        //sendMessage(s.getEmail(),"Activate your account",body);
        sendMessage("giusepe.pastore10@libero.it","Activate your account",body);
    }

    @Override
    public boolean activate(String token) {
        Timestamp today = new Timestamp(System.currentTimeMillis());
        Optional<ConfirmAccount> t=confirmAccountRepository.findById(token);
        if (!t.isPresent())
            throw new TokenNotFoundException("Specified token not found");
        ConfirmAccount ca = t.get();

        if (ca.getExpiryDate().before(today))
            throw new ExpiredTokenException("Expired token");

        confirmAccountRepository.deleteById(token);

        teamService.activateAccount(ca.getUserId());

        return true;
    }




    @Scheduled(initialDelay = 6*1000, fixedRate = 10*1000)
    public void run() {
        Timestamp now = new Timestamp(System.currentTimeMillis());
        List<Token> expired = tokenRepository.findAllByExpiryDateBefore(now);
        Set<Long> teams = expired.stream().map(x->x.getTeamId()).collect(Collectors.toSet());
        tokenRepository.deleteAll(expired);
        teams.stream().forEach(x->tokenRepository.deleteAll(tokenRepository.findAllByTeamId(x)));
        teamService.evictAll(teams);   // posso riportare eventualmente qualki team erano già stati cancellatio prima della scadenza del token


        //TO DO: move on a separated file for authentication service
        List<ConfirmAccount> expired_accounts = confirmAccountRepository.findAllByExpiryDateBefore(now);
        Set<String> users = expired_accounts.stream().map(x->x.getUserId()).collect(Collectors.toSet());
        confirmAccountRepository.deleteAll(expired_accounts);
        teamService.deleteAll(users);

    }



}
