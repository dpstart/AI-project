package it.polito.ai.esercitazione2.controllers;


import it.polito.ai.esercitazione2.dtos.AssignmentDTO;
import it.polito.ai.esercitazione2.dtos.CourseDTO;
import it.polito.ai.esercitazione2.dtos.HomeworkDTO;
import it.polito.ai.esercitazione2.dtos.ProfessorDTO;
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

import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.List;

import java.util.Map;
import java.util.Optional;
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
        } catch (IncoherenceException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        } catch(AuthenticationServiceException e){
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }
        return ModelHelper.enrich(p);
    }

    @GetMapping({"","/"})
    List<ProfessorDTO> all(){
        return teamservice.getAllProfessors().stream()
                .map(x->ModelHelper.enrich(x)).collect(Collectors.toList());
    }

    @GetMapping("/{name}")
    ProfessorDTO getOne(@PathVariable String name) {
        ProfessorDTO c = teamservice.getProfessor(name).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, name));
        return ModelHelper.enrich(c);
    }

    @GetMapping("/courses")
    List<CourseDTO> getCourses(){
        try {
            return teamservice.getCoursesByProf(null).stream()
                    .map(x->ModelHelper.enrich(x)).collect(Collectors.toList());
        }catch (ProfessorNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    @GetMapping("/{name}/courses")
    List<CourseDTO> getCourses(@PathVariable String name){
        try {
            return teamservice.getCoursesByProf(name).stream()
                    .map(x->ModelHelper.enrich(x)).collect(Collectors.toList());
        }catch (ProfessorNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    @GetMapping("/image")
    Image getProfileImage(){

        Image img = teamservice.getProfileImage();
        return img;
    }

    @GetMapping("/{name}/assignments")
    List<AssignmentDTO> getAssignments(@PathVariable String name){
        try{
            return assignmentService.getByProfessor(name)
                    .stream()
                    .map(x -> ModelHelper.enrich(x))
                    .collect(Collectors.toList());
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
    }

    @GetMapping("/{name}/assignments/{aId}/")
    public AssignmentDTO getAssignment(@PathVariable String name, @PathVariable Integer aId){
        try{
            String course = assignmentService.getAssignmentCourse(aId);
            return courseController.getAssignment(course, aId);
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
    }

    @GetMapping("/{name}/homeworks")
    List<HomeworkDTO> getHomeworks(@PathVariable String name){
        try{
            return assignmentService.getByProfessor(name)
                    .stream()
                    .flatMap(a -> assignmentService.getAssignmentHomeworks(a.getId()).stream())
                    .map(x -> ModelHelper.enrich(x))
                    .collect(Collectors.toList());
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
    }

    @GetMapping("/{name}/homeworks/{hId}/")
    public HomeworkDTO getHomework(@PathVariable String name, @PathVariable Long hId){
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
            int size_codes=error.getCodes().length;
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
