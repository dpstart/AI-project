package it.polito.ai.esercitazione2.exceptions;

import it.polito.ai.esercitazione2.services.NotificationService;

public class TokenNotFoundException extends NotificationServiceException {
    public TokenNotFoundException(String message) {
        super(message);
    }
}
