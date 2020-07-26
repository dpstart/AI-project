package it.polito.ai.esercitazione2;

import org.apache.commons.text.RandomStringGenerator;
import org.modelmapper.ModelMapper;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableScheduling
@EnableAsync
@EnableTransactionManagement
public class Esercitazione2Application {

    @Bean
    ModelMapper modelMapper(){
        return new ModelMapper();
    }



    @Bean
    public SimpleMailMessage templateConfirmRejectMessage() {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setText(
                "Please  click on the following link to accept the invitation:\n%s\n"+
                "\nIf you don't want to join you can reject by clicking on:\n%s\n");
        return message;
    }

    @Bean
    public SimpleMailMessage templateActivationMessage() {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setText(
                "Hello %s,\nPlease  click on the following link to activate your account:\n%s\n");
        return message;
    }

    @Bean
    public RandomStringGenerator randomStringGenerator(){
        char [][] pairs ={{'a','z'},{'0','9'}};
        return new RandomStringGenerator.Builder().withinRange(pairs).build();
    }






    public static void main(String[] args) {

        SpringApplication.run(Esercitazione2Application.class, args);

    }

}
