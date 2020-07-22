package it.polito.ai.esercitazione2.exceptions;

public class HomeworkIsNotFinalException extends TeamServiceException {
    public HomeworkIsNotFinalException(String message) {
        super(message);
    }
}