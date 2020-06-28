package it.polito.ai.esercitazione2.exceptions;

public class UnavailableResourcesForTeamException extends NotificationServiceException {
    public UnavailableResourcesForTeamException(String message) {
        super(message);
    }
}
