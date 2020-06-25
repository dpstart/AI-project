package it.polito.ai.esercitazione2.exceptions;

public class AlreadyInACourseTeamException extends TeamServiceException {
    public AlreadyInACourseTeamException(String message) {
        super(message);
    }
}
