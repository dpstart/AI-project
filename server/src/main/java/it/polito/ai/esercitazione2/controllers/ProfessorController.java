package it.polito.ai.esercitazione2.controllers;


import it.polito.ai.esercitazione2.dtos.*;
import it.polito.ai.esercitazione2.entities.Image;
import it.polito.ai.esercitazione2.exceptions.AuthenticationServiceException;
import it.polito.ai.esercitazione2.exceptions.IncoherenceException;

import it.polito.ai.esercitazione2.exceptions.ProfessorNotFoundException;

import it.polito.ai.esercitazione2.services.AssignmentService;
import it.polito.ai.esercitazione2.services.HomeworkService;
import it.polito.ai.esercitazione2.services.TeamService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.MessageSource;
import org.springframework.context.NoSuchMessageException;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.Valid;
import java.util.*;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/API/professors")
public class ProfessorController {

    @Autowired
    TeamService teamservice;

    @Autowired
    AssignmentService assignmentService;

    @Autowired
    HomeworkService homeworkService;

    @Autowired
    CourseController courseController;

    @Autowired
    @Qualifier("messageSource")
    MessageSource msg;




   @PostMapping({"","/"})
   ProfessorDTO addProfessor(@Valid @RequestPart("professor") ProfessorDTO p,  @RequestPart(value="image",required=false) MultipartFile file) {

        try {
            if (file==null || file.isEmpty()) {
                if (!teamservice.addProfessor(p))
                    throw new ResponseStatusException(HttpStatus.CONFLICT, p.getId());
            }
            else {
                if (!teamservice.addProfessor(p,file))
                    throw new ResponseStatusException(HttpStatus.CONFLICT, p.getId());
            }
        } catch (IncoherenceException | AuthenticationServiceException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }
        return ModelHelper.enrich(p);
    }

    @GetMapping({"","/"})
    List<ProfessorDTO> all(){
        return teamservice.getAllProfessors().stream()
                .map(ModelHelper::enrich).collect(Collectors.toList());
    }

    @GetMapping("/{professorId}")
    ProfessorDTO getOne(@PathVariable String professorId) {
        ProfessorDTO c = teamservice.getProfessor(professorId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, professorId));
        return ModelHelper.enrich(c);
    }


    @GetMapping("/self")
    ProfessorDTO getSelf() {
        String professorId = SecurityContextHolder.getContext().getAuthentication().getName();
        ProfessorDTO c = teamservice.getProfessor(professorId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, professorId));
        return ModelHelper.enrich(c);
    }


    @GetMapping("/allCourses")
    List<CourseDTO> getAllCourses(){
        try {
            return teamservice.getCoursesByProf(null).stream()
                    .map(ModelHelper::enrich).collect(Collectors.toList());
        }catch (ProfessorNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    @GetMapping("/courses")
    List<CourseDTO> getCourses(){
        try {
            return teamservice.getCoursesByProf(SecurityContextHolder.getContext().getAuthentication().getName()).stream()
                    .map(ModelHelper::enrich).collect(Collectors.toList());
        }catch (ProfessorNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    @GetMapping("/image")
    ImageDTO getProfileImage(){

        return teamservice.getProfileImage();
    }

    @GetMapping("/{professorId}/assignments")
    List<AssignmentDTO> getAssignments(@PathVariable String professorId){
        try{
            return assignmentService.getByProfessor(professorId)
                    .stream()
                    .map(x -> ModelHelper.enrich(x, assignmentService.getAssignmentCourse(x.getId()), professorId))
                    .collect(Collectors.toList());
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
    }

    @GetMapping("/{professorId}/assignments/{aId}/")
    public AssignmentDTO getAssignment(@PathVariable String professorId, @PathVariable Integer aId){
        try{
            String course = assignmentService.getAssignmentCourse(aId);
            return courseController.getAssignment(course, aId);
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
    }

    @GetMapping("/{professorId}/homeworks")
    List<HomeworkDTO> getHomeworks(@PathVariable String professorId){
        try{
            return assignmentService.getByProfessor(professorId)
                    .stream()
                    .flatMap(a -> assignmentService.getAssignmentHomeworks(a.getId()).stream())
                    .map(h -> {
                        String courseId = homeworkService.getHomeworkCourse(h.getId());
                        Integer assignmentId = homeworkService.getAssignmentId(h.getId());
                        String studentId = homeworkService.getHomeworkStudentId(h.getId());;
                        return ModelHelper.enrich(h, courseId, assignmentId, professorId, studentId);
                    })
                    .collect(Collectors.toList());
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
    }

    @GetMapping("/{professorId}/homeworks/{hId}/")
    public HomeworkDTO getHomework(@PathVariable String professorId, @PathVariable Long hId){
        try{
            String course = homeworkService.getHomeworkCourse(hId);
            Integer aId = homeworkService.getAssignmentId(hId);
            return courseController.getHomework(course, aId, hId);
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Map<String, String> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            int size_codes = Objects.requireNonNull(error.getCodes()).length;
            int i=0;
            String errorMessage="";
            while(i<size_codes){
                try{
                    errorMessage = msg.getMessage(error.getCodes()[i],error.getArguments(), LocaleContextHolder.getLocale());

                    break;
                } catch(NoSuchMessageException e) {
                    i++;
                }

            }
            errors.put(fieldName, errorMessage);
        });
        return errors;
    }
}
