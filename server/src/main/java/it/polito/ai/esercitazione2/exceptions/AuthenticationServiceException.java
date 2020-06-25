package it.polito.ai.esercitazione2.exceptions;

public class AuthenticationServiceException extends RuntimeException {

    public AuthenticationServiceException(String message){
        super(message);
    }
}
