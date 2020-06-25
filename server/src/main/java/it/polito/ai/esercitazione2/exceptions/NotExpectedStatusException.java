package it.polito.ai.esercitazione2.exceptions;

public class NotExpectedStatusException extends TeamServiceException {
    public NotExpectedStatusException(String message) {
        super(message);
    }
}
