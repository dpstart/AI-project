package it.polito.ai.esercitazione2.exceptions;

public class VMModelNotDefinedException extends TeamServiceException {

    public VMModelNotDefinedException(String message) {
        super(message);
    }
}
