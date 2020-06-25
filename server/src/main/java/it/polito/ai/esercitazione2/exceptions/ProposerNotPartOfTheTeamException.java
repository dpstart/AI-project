package it.polito.ai.esercitazione2.exceptions;

public class ProposerNotPartOfTheTeamException  extends TeamServiceException {
    public ProposerNotPartOfTheTeamException(String message) {
        super(message);
    }
}
