package it.polito.ai.esercitazione2.exceptions;

public class TeamAuthorizationException extends TeamServiceException {
    public TeamAuthorizationException(String message) {
        super(message);
    }
}
