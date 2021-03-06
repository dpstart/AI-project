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


    // base method to send Mail
    // async operation
    @Override
    @Async
    public void sendMessage(String address, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        //message.setTo(address);
        message.setTo("johndoe.appint@gmail.com");
        message.setSubject(subject);
        message.setText(body);
        try {
            emailSender.send(message);
        } catch (MailException e) {
            log.severe("Some problems occur with the mail sending ");
        }

    }

    // if present and not expired, delete the token if not the last; if it's the last, confirm the activation of the team
    @Override
    public boolean confirm(String token) {
        Timestamp today = new Timestamp(System.currentTimeMillis());
        Optional<Token> t = tokenRepository.findById(token);
        if (!t.isPresent())
            throw new TokenNotFoundException("Specified token not found");
        Token to = t.get();

        if (to.getExpiryDate().before(today))
            throw new ExpiredTokenException("Expired token");

        // delete the confrimed token
        tokenRepository.deleteById(token);

        // if there are other tokens associated to the same team, simply return
        List<Token> lt = tokenRepository.findAllByTeamId(to.getTeamId());
        if (lt.size() > 0)
            return false;

        // .. otherwise the teams is ready to be activated, unless other unexpected events occured
        if (!teamService.activateTeam(to.getTeamId()))
            throw new TeamNotFoundException("Team associated with this token doesn't exist anymore");

        return true;
    }

    // if present and not expired, evict the team associated
    @Override
    public boolean reject(String token) {
        Timestamp today = new Timestamp(System.currentTimeMillis());
        Optional<Token> t = tokenRepository.findById(token);
        if (!t.isPresent())
            throw new TokenNotFoundException("Specified token not found");

        Token to = t.get();
        if (to.getExpiryDate().before(today))
            throw new ExpiredTokenException("Expired token");

        // delete the rejected token
        tokenRepository.deleteById(token);
        // delete all the tokens associated to the team to be evicted
        tokenRepository.deleteAll(tokenRepository.findAllByTeamId(to.getTeamId()));

        // evict the team
        if (!teamService.evictTeam(to.getTeamId()))
            throw new TeamNotFoundException("Team associated with this token doesn't exist anymore");

        return true;
    }


    // send a mail to the user with a confirm and a reject link.
    @Override
    @Async
    public void notifyTeam(String team,Map<String,String> tokens ) {

        for (String s : tokens.keySet()) {
            String token = tokens.get(s);

            String body = String.format(template.getText(), "http://localhost:4200/confirm/" + token, "http://localhost:4200/reject/" + token);
            //sendMessage("s"+s+"@studenti.polito.it","Invitation to join team: "+dto.getName(),body);
            sendMessage("giuseppe.pastore10@libero.it", "Invitation to join team: " + team, body);

        }
    }

    // generate a token for a team with the defined expiration time
    @Override
    public Map<String,String> generateTokens(Long team,List<String> memberIds,Long expiration){
        Map<String,String> tokens= new HashMap<>();
        Timestamp expiryDate = new Timestamp(System.currentTimeMillis() + expiration);
        for (String s : memberIds) {
            String token = UUID.randomUUID().toString();
            tokens.put(s, token);
            Token t = new Token();
            t.setId(token);
            t.setTeamId(team);
            t.setUserId(s);
            t.setExpiryDate(expiryDate);
            tokenRepository.save(t);
        }
        return tokens;
    }



    // generate a ConfirmAccount token and send the mail to the new student with the activation link
    @Override
    @Async
    public void notifyStudent(StudentDTO s) {
        Timestamp expiryDate = new Timestamp(System.currentTimeMillis() + (60 * 60 * 1000));

        String token = UUID.randomUUID().toString();
        ConfirmAccount ca = new ConfirmAccount();
        ca.setId(token);
        ca.setUserId(s.getId());
        ca.setExpiryDate(expiryDate);
        confirmAccountRepository.save(ca);
        String body = String.format(activation_template.getText(), s.getFirstName(), "http://localhost:4200/activate/" + token);
        // sendMessage(s.getEmail(),"Activate your account",body);
        sendMessage("giuseppe.pastore10@libero.it", "Activate your account", body);

    }

    // generate a ConfirmAccount token and send the mail to the new professor with the activation link
    @Override
    @Async
    public void notifyProfessor(ProfessorDTO s) {
        Timestamp expiryDate = new Timestamp(System.currentTimeMillis() + (60 * 60 * 1000));
        String token = UUID.randomUUID().toString();
        ConfirmAccount ca = new ConfirmAccount();
        ca.setId(token);
        ca.setUserId(s.getId());
        ca.setExpiryDate(expiryDate);
        confirmAccountRepository.save(ca);
        String body = String.format(activation_template.getText(), "Prof."+ s.getName(), "http://localhost:4200/activate/" + token);
        //sendMessage(s.getEmail(),"Activate your account",body);
        sendMessage("giuseppe.pastore10@libero.it", "Activate your account", body);
    }


    // if present and not expired, delete the confirmation account and activate the account through \activate of the authentication service
    @Override
    public boolean activate(String token) {
        Timestamp today = new Timestamp(System.currentTimeMillis());
        Optional<ConfirmAccount> t = confirmAccountRepository.findById(token);
        if (!t.isPresent())
            throw new TokenNotFoundException("Specified token not found");
        ConfirmAccount ca = t.get();

        if (ca.getExpiryDate().before(today))
            throw new ExpiredTokenException("Expired token");

        confirmAccountRepository.deleteById(token);

        teamService.activateAccount(ca.getUserId());

        return true;
    }


    // fixedRate: for now, each hour
    @Scheduled(initialDelay = 6 * 1000, fixedRate = 60*60 * 1000)
    public void run() {
        Timestamp now = new Timestamp(System.currentTimeMillis());
        // find all the token with an expiration date prior to the current one
        List<Token> expired = tokenRepository.findAllByExpiryDateBefore(now);
        if (expired.size() != 0) {
            // find the distinct teams associated to the expired tokens
            Set<Long> teams = expired.stream().map(x -> x.getTeamId()).collect(Collectors.toSet());
            //delete the expired tokens
            tokenRepository.deleteAll(expired);
            // delete all the tokens associated to the "expired" team, that for some reasons have not yet expired
            teams.stream().forEach(x -> tokenRepository.deleteAll(tokenRepository.findAllByTeamId(x)));
            // evict the teams associated to the expired tokens
            teamService.evictAll(teams);
        }

        // do the same for account tokens

        //TO DO: move on a separated file for authentication service, when they are separated
        // find all the expired account confrimation tokens
        List<ConfirmAccount> expired_accounts = confirmAccountRepository.findAllByExpiryDateBefore(now);
        if (expired_accounts.size() != 0) {
            Set<String> users = expired_accounts.stream().map(x -> x.getUserId()).collect(Collectors.toSet());
            //delete all the expred tokens
            confirmAccountRepository.deleteAll(expired_accounts);
            //delete all the disabled account for which the token is expired
            teamService.deleteAll(users);
        }
    }


}
