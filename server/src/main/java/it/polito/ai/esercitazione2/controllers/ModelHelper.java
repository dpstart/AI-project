package it.polito.ai.esercitazione2.controllers;

import it.polito.ai.esercitazione2.dtos.*;
import org.springframework.hateoas.Link;


import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

public class ModelHelper {

    public static CourseDTO enrich(CourseDTO c){
        Link self=linkTo(CourseController.class).slash(c.getName()).withSelfRel();
        c.add(self);

        Link enrolled = linkTo(methodOn(CourseController.class)
                .enrolledStudents(c.getName())).withRel("enrolled");
        c.add(enrolled);
        try {
            Link enable = linkTo(
                    CourseController.class,
                    CourseController.class
                            .getMethod("enableCourse", String.class),
                    c.getName())
                    .withRel("enable");
            c.add(enable);
        }catch (NoSuchMethodException e){
            //ignore
        }
        try{
            Link disable = linkTo(
                    CourseController.class,
                    CourseController.class
                            .getMethod("disableCourse", String.class),
                    c.getName())
                    .withRel("disable");
            c.add(disable);
        }catch (NoSuchMethodException e){
            //ignore
        }

        Link teams = linkTo(methodOn(CourseController.class)
                .getTeams(c.getName())).withRel("teams");
        c.add(teams);

        Link alreadyInTeams = linkTo(methodOn(CourseController.class)
                .getStudentsInTeams(c.getName())).withRel("alreadyInTeams");
        c.add(alreadyInTeams);

        Link yetAvailable = linkTo(methodOn(CourseController.class)
                .getAvailableStudents(c.getName())).withRel("yetAvailable");
        c.add(yetAvailable);
        return c;
    }

    public static StudentDTO enrich(StudentDTO c){
        Link l=linkTo(StudentController.class).slash(c.getId()).withSelfRel();
        c.add(l);
        Link courses = linkTo(methodOn(StudentController.class)
                .getCourses()).withRel("courses");
        c.add(courses);

        Link teams = linkTo(methodOn(StudentController.class)
                .getTeams()).withRel("teams");
        c.add(teams);

        Link image = linkTo(methodOn(StudentController.class)
                .getImage(c.getId())).withRel("image");
        c.add(image);

        return c;
    }

    public static ProfessorDTO enrich(ProfessorDTO c){
        Link l=linkTo(ProfessorController.class).slash(c.getId()).withSelfRel();
        c.add(l);

        Link courses = linkTo(methodOn(ProfessorController.class)
                .getCourses(c.getId())).withRel("courses");
        c.add(courses);

        Link image = linkTo(methodOn(StudentController.class)
                .getImage(c.getId())).withRel("image");
        c.add(image);

        return c;
    }
    public static TeamDTO enrich(TeamDTO c,String course){

        Link self = linkTo(methodOn(CourseController.class)
                .getTeam(course,c.getId())).withSelfRel();
        c.add(self);

        Link members = linkTo(methodOn(CourseController.class)
                .getTeamMembers(course,c.getId())).withRel("members");
        c.add(members);


        return c;
    }

    public static VMDTO enrich(VMDTO c){

        Link self = linkTo(methodOn(VMController.class)
                .getVM(c.getId())).withSelfRel();
        c.add(self);


        try {

            Link run = linkTo(
                    VMController.class,
                    VMController.class.getMethod("runVM",Long.class),
                    c.getId())
                    .withRel("run");
            c.add(run);

            Link stop = linkTo(
                    VMController.class,
                    VMController.class.getMethod("stopVM",Long.class),
                    c.getId()).withRel("stop");
            c.add(stop);

            Link remove = linkTo(
                    VMController.class,
                    VMController.class.getMethod("removeVM",Long.class),
                    c.getId()).withRel("remove");
            c.add(remove);
        }catch (NoSuchMethodException e){
            //ignore
        }




        return c;
    }

    public static VMModelDTO enrich(VMModelDTO c){

        Link self = linkTo(methodOn(VMModelController.class)
                .getVMModel(c.getName())).withSelfRel();
        c.add(self);

        return c;
    }

}
