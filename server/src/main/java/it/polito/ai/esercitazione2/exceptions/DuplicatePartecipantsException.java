package it.polito.ai.esercitazione2.exceptions;

public class DuplicatePartecipantsException extends TeamServiceException {
    public DuplicatePartecipantsException(String message) {
        super(message);
    }
}
