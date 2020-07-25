package it.polito.ai.esercitazione2.exceptions;

public class UserUnathorizedException extends TeamServiceException {
    public UserUnathorizedException(String message) {
        super(message);
    }
}
