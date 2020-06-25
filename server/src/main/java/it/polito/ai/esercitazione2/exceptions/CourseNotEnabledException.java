package it.polito.ai.esercitazione2.exceptions;

public class CourseNotEnabledException extends TeamServiceException {
    public CourseNotEnabledException(String message) {
        super(message);
    }
}
