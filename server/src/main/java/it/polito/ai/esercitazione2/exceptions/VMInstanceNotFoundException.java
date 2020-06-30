package it.polito.ai.esercitazione2.exceptions;

public class VMInstanceNotFoundException extends TeamServiceException {

    public VMInstanceNotFoundException (String message) {
        super(message);
    }
}
