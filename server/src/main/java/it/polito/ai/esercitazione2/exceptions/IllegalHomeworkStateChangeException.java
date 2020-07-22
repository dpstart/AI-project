package it.polito.ai.esercitazione2.exceptions;

public class IllegalHomeworkStateChangeException extends TeamServiceException {
    public IllegalHomeworkStateChangeException(String message) {
        super(message);
    }
}