package it.polito.ai.esercitazione2.exceptions;

public class TeamServiceException extends RuntimeException {

    public TeamServiceException(String message){
        super(message);
    }
}
