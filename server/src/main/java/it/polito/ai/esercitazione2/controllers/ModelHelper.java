package it.polito.ai.esercitazione2.controllers;

import it.polito.ai.esercitazione2.dtos.*;
import it.polito.ai.esercitazione2.entities.Assignment;
import it.polito.ai.esercitazione2.entities.Image;
import org.springframework.hateoas.Link;


import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

public class ModelHelper {

    public static CourseDTO enrich(CourseDTO c) {
        Link self = linkTo(CourseController.class).slash(c.getName()).withSelfRel();
        c.add(self);
        Link self_alias = linkTo(CourseController.class).slash(c.getAcronime()).withSelfRel();
        c.add(self_alias);

        Link enrolled = linkTo(methodOn(CourseController.class)
                .enrolledStudents(c.getName())).withRel("enrolled");
        c.add(enrolled);
        Link enrolled_alias = linkTo(methodOn(CourseController.class)
                .enrolledStudents(c.getAcronime())).withRel("enrolled");
        c.add(enrolled_alias);


        try {
            Link enable = linkTo(
                    CourseController.class,
                    CourseController.class
                            .getMethod("enableCourse", String.class),
                    c.getName())
                    .withRel("enable");
            c.add(enable);
            Link enable_alias = linkTo(
                    CourseController.class,
                    CourseController.class
                            .getMethod("enableCourse", String.class),
                    c.getAcronime())
                    .withRel("enable");
            c.add(enable_alias);
        } catch (NoSuchMethodException e) {
            //ignore
        }
        try {
            Link disable = linkTo(
                    CourseController.class,
                    CourseController.class
                            .getMethod("disableCourse", String.class),
                    c.getName())
                    .withRel("disable");
            c.add(disable);
            Link disable_alias = linkTo(
                    CourseController.class,
                    CourseController.class
                            .getMethod("disableCourse", String.class),
                    c.getAcronime())
                    .withRel("disable");
            c.add(disable_alias);
        } catch (NoSuchMethodException e) {
            //ignore
        }
        try {
            Link remove = linkTo(
                    CourseController.class,
                    CourseController.class.getMethod("removeCourse", String.class),
                    c.getName())
                    .withRel("remove");
            c.add(remove);

            Link remove_alias = linkTo(
                    CourseController.class,
                    CourseController.class.getMethod("removeCourse", String.class),
                    c.getAcronime())
                    .withRel("remove");
            c.add(remove_alias);
        } catch (NoSuchMethodException e) {
            //ignore
        }


        Link teams = linkTo(methodOn(CourseController.class)
                .getTeams(c.getName())).withRel("teams");
        c.add(teams);
        Link teams_alias = linkTo(methodOn(CourseController.class)
                .getTeams(c.getAcronime())).withRel("teams");
        c.add(teams_alias);

        Link alreadyInTeams = linkTo(methodOn(CourseController.class)
                .getStudentsInTeams(c.getName())).withRel("alreadyInTeams");
        c.add(alreadyInTeams);
        Link alreadyInTeams_alias = linkTo(methodOn(CourseController.class)
                .getStudentsInTeams(c.getAcronime())).withRel("alreadyInTeams");
        c.add(alreadyInTeams_alias);

        Link yetAvailable = linkTo(methodOn(CourseController.class)
                .getAvailableStudents(c.getName())).withRel("yetAvailable");
        c.add(yetAvailable);

        Link yetAvailable_alias = linkTo(methodOn(CourseController.class)
                .getAvailableStudents(c.getAcronime())).withRel("yetAvailable");
        c.add(yetAvailable_alias);
        return c;
    }

    public static StudentDTO enrich(StudentDTO s) {
        Link l = linkTo(StudentController.class).slash(s.getId()).withSelfRel();
        s.add(l);
        Link courses = linkTo(methodOn(StudentController.class)
                .getCourses()).withRel("courses");
        s.add(courses);

        Link teams = linkTo(methodOn(StudentController.class)
                .getTeams()).withRel("teams");
        s.add(teams);

        Link image = linkTo(methodOn(StudentController.class)
                .getProfileImage()).withRel("image");
        s.add(image);

        return s;
    }

    public static ProfessorDTO enrich(ProfessorDTO p) {
        Link l = linkTo(ProfessorController.class).slash(p.getId()).withSelfRel();
        p.add(l);

        Link courses = linkTo(methodOn(ProfessorController.class)
                .getAllCourses()).withRel("courses");
        p.add(courses);

        Link image = linkTo(methodOn(ProfessorController.class)
                .getProfileImage()).withRel("image");
        p.add(image);

        return p;
    }

    public static TeamDTO enrich(TeamDTO t, String course) {

        Link self = linkTo(methodOn(CourseController.class)
                .getTeam(course, t.getId())).withSelfRel();
        t.add(self);

        Link members = linkTo(methodOn(CourseController.class)
                .getTeamMembers(course, t.getId())).withRel("members");
        t.add(members);

        Link creator = linkTo(methodOn(StudentController.class)
                .getOne(t.getId_creator())).withRel("creator");
        t.add(creator);

        Link adhesionStatus = linkTo(methodOn(CourseController.class)
                .getAdhesionInfo(course, t.getId())).withRel("adhesion");
        t.add(adhesionStatus);


        return t;
    }

    public static VMDTO enrich(VMDTO vm) {

        Link self = linkTo(methodOn(VMController.class)
                .getVM(vm.getId())).withSelfRel();
        vm.add(self);


        try {

            Link run = linkTo(
                    VMController.class,
                    VMController.class.getMethod("runVM", Long.class),
                    vm.getId())
                    .withRel("run");
            vm.add(run);

            Link stop = linkTo(
                    VMController.class,
                    VMController.class.getMethod("stopVM", Long.class),
                    vm.getId()).withRel("stop");
            vm.add(stop);

            Link remove = linkTo(
                    VMController.class,
                    VMController.class.getMethod("removeVM", Long.class),
                    vm.getId()).withRel("remove");
            vm.add(remove);
        } catch (NoSuchMethodException e) {
            //ignore
        }

        Link creator = linkTo(methodOn(StudentController.class)
                .getOne(vm.getId_creator())).withRel("creator");
        vm.add(creator);

        return vm;
    }

    public static VMModelDTO enrich(VMModelDTO vmm) {

        Link self = linkTo(methodOn(VMModelController.class)
                .getVMModel(vmm.getName())).withSelfRel();
        vmm.add(self);

        Link delete = linkTo(methodOn(VMModelController.class)
                .removeVMModel(vmm.getName())).withRel("delete");
        vmm.add(delete);

        return vmm;
    }
    public static AssignmentDTO enrich(AssignmentDTO a, String courseName, String professorId) {
        Link self = linkTo(methodOn(CourseController.class)
                .getAssignment(courseName, a.getId())).withSelfRel();
        a.add(self);

        Link course = linkTo(methodOn(CourseController.class)
                .getOne(courseName)).withRel("course");
        a.add(course);

        Link professor = linkTo(methodOn(ProfessorController.class)
                .getOne(professorId))
                .withRel("professor");
        a.add(professor);

        Link homeworks = linkTo(methodOn(CourseController.class)
                .getAssignmentHomeworks(courseName, a.getId()))
                .withRel("homeworks");
        a.add(homeworks);

        Link image = linkTo(methodOn(CourseController.class)
                .getAssignmentImage(courseName, a.getId())).withRel("image");
        a.add(image);

        return a;
    }

    public static HomeworkDTO enrich(HomeworkDTO h, String courseName, Integer assignmentId,
                                     String professorId, String studentId) {
        Link self = linkTo(methodOn(CourseController.class)
                .getHomework(courseName, assignmentId, h.getId())).withSelfRel();
        h.add(self);

        Link course = linkTo(methodOn(CourseController.class)
                .getOne(courseName)).withRel("course");
        h.add(course);

        Link professor = linkTo(methodOn(ProfessorController.class)
                .getOne(professorId))
                .withRel("professor");
        h.add(professor);

        Link student = linkTo(methodOn(StudentController.class)
                .getOne(studentId))
                .withRel("student");
        h.add(student);

        Link versions = linkTo(methodOn(CourseController.class)
                .getHomeworkVersions(courseName, assignmentId, h.getId())).withRel("versions");
        h.add(versions);

        return h;
    }

    public static HomeworkVersionDTO enrich(HomeworkVersionDTO hv, String courseName, Integer assignmentId, Long homeworkId, Integer index) {


        Link self = linkTo(methodOn(CourseController.class)
                .getHomeworkVersion(courseName, assignmentId, homeworkId, index))
                .withSelfRel();
        Link timestamp = linkTo(methodOn(CourseController.class)
                .getHomeworkVersionDeliveryDate(courseName, assignmentId, homeworkId, index)).withRel("deliveryDate");

        Link image =linkTo(methodOn(CourseController.class)
                .getHomeworkVersionImage(courseName, assignmentId, homeworkId, index))
                .withRel("image");
        hv.add(self);
        hv.add(timestamp);
        hv.add(image);

        return hv;
    }

    public static ImageDTO enrich(ImageDTO img, String name, Integer assignmentId) {

        Link self = linkTo(methodOn(CourseController.class)
                .getAssignmentImage(name, assignmentId))
                .withSelfRel();
        img.add(self);

        return img;
    }

    public static ImageDTO enrich(ImageDTO img, String name, Integer assignmentId, Long hwId, Integer versionId) {

        Link self = linkTo(methodOn(CourseController.class)
                .getHomeworkVersionImage(name, assignmentId, hwId, versionId))
                .withSelfRel();
        img.add(self);

        return img;
    }
}
