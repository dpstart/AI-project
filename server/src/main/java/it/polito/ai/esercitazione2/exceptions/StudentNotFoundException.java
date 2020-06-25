package it.polito.ai.esercitazione2.exceptions;

public class StudentNotFoundException extends TeamServiceException {
    public StudentNotFoundException(String message) {
        super(message);
    }
}
