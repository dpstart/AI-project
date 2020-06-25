package it.polito.ai.esercitazione2.exceptions;

public class ProfessorNotFoundException extends TeamServiceException  {
    public ProfessorNotFoundException(String message) {
        super(message);
    }
}
