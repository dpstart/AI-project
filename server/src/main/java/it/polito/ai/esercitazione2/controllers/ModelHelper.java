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

    public static StudentDTO enrich(StudentDTO s){
        Link l=linkTo(StudentController.class).slash(s.getId()).withSelfRel();
        s.add(l);
        Link courses = linkTo(methodOn(StudentController.class)
                .getCourses()).withRel("courses");
        s.add(courses);

        Link teams = linkTo(methodOn(StudentController.class)
                .getTeams()).withRel("teams");
        s.add(teams);

        Link image = linkTo(methodOn(StudentController.class)
                .getImage(s.getId())).withRel("image");
        s.add(image);

        return s;
    }

    public static ProfessorDTO enrich(ProfessorDTO p){
        Link l=linkTo(ProfessorController.class).slash(p.getId()).withSelfRel();
        p.add(l);

        Link courses = linkTo(methodOn(ProfessorController.class)
                .getCourses(p.getId())).withRel("courses");
        p.add(courses);

        Link image = linkTo(methodOn(StudentController.class)
                .getImage(p.getId())).withRel("image");
        p.add(image);

        return p;
    }
    public static TeamDTO enrich(TeamDTO t,String course){

        Link self = linkTo(methodOn(CourseController.class)
                .getTeam(course,t.getId())).withSelfRel();
        t.add(self);

        Link members = linkTo(methodOn(CourseController.class)
                .getTeamMembers(course,t.getId())).withRel("members");
        t.add(members);


        return t;
    }

    public static VMDTO enrich(VMDTO vm){

        Link self = linkTo(methodOn(VMController.class)
                .getVM(vm.getId())).withSelfRel();
        vm.add(self);


        try {

            Link run = linkTo(
                    VMController.class,
                    VMController.class.getMethod("runVM",Long.class),
                    vm.getId())
                    .withRel("run");
            vm.add(run);

            Link stop = linkTo(
                    VMController.class,
                    VMController.class.getMethod("stopVM",Long.class),
                    vm.getId()).withRel("stop");
            vm.add(stop);

            Link remove = linkTo(
                    VMController.class,
                    VMController.class.getMethod("removeVM",Long.class),
                    vm.getId()).withRel("remove");
            vm.add(remove);
        }catch (NoSuchMethodException e){
            //ignore
        }




        return vm;
    }

    public static VMModelDTO enrich(VMModelDTO vmm){

        Link self = linkTo(methodOn(VMModelController.class)
                .getVMModel(vmm.getName())).withSelfRel();
        vmm.add(self);

        return vmm;
    }

}
