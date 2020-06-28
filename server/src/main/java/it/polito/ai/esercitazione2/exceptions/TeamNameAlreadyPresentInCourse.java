package it.polito.ai.esercitazione2.exceptions;

public class TeamNameAlreadyPresentInCourse extends TeamServiceException {

    public TeamNameAlreadyPresentInCourse(String message) {
        super(message);
    }
}

