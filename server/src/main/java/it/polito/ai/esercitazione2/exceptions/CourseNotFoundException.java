package it.polito.ai.esercitazione2.exceptions;

public class CourseNotFoundException extends TeamServiceException {

    public CourseNotFoundException(String message){
        super(message);
    }
}
