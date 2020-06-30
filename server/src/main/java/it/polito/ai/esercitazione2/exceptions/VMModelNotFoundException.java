package it.polito.ai.esercitazione2.exceptions;

public class VMModelNotFoundException extends TeamServiceException {

    public VMModelNotFoundException(String message) {
        super(message);
    }
}
