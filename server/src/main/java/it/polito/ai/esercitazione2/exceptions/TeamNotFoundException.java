package it.polito.ai.esercitazione2.exceptions;

public class TeamNotFoundException extends TeamServiceException {


    public TeamNotFoundException(String message) {
        super(message);
    }
}
