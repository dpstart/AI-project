package it.polito.ai.esercitazione2.exceptions;

public class HomeworkNotFoundException extends TeamServiceException {
    public HomeworkNotFoundException(String message) {
        super(message);
    }
}
