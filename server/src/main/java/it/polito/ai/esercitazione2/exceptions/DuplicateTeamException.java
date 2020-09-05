package it.polito.ai.esercitazione2.exceptions;

public class DuplicateTeamException extends TeamServiceException {
    public DuplicateTeamException(String message) {
        super(message);
    }
}
