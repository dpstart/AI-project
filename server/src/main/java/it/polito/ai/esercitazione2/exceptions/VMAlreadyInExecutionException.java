package it.polito.ai.esercitazione2.exceptions;

public class VMAlreadyInExecutionException extends TeamServiceException {

    public VMAlreadyInExecutionException (String message) {
        super(message);
    }
}
