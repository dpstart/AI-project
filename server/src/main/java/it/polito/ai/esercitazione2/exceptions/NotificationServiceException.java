package it.polito.ai.esercitazione2.exceptions;

public class NotificationServiceException extends RuntimeException {

    public NotificationServiceException(String message){
        super(message);
    }
}
