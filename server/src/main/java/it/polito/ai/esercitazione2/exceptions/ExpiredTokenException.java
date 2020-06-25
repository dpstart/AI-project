package it.polito.ai.esercitazione2.exceptions;

public class ExpiredTokenException extends NotificationServiceException {
    public ExpiredTokenException(String message) {
        super(message);
    }
}
