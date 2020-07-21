package it.polito.ai.esercitazione2.controllers;


import it.polito.ai.esercitazione2.dtos.CourseDTO;
import it.polito.ai.esercitazione2.dtos.StudentDTO;
import it.polito.ai.esercitazione2.dtos.TeamDTO;
import it.polito.ai.esercitazione2.dtos.ValidStudentDTOList;
import it.polito.ai.esercitazione2.entities.Image;
import it.polito.ai.esercitazione2.exceptions.AuthenticationServiceException;
import it.polito.ai.esercitazione2.exceptions.IncoherenceException;
import it.polito.ai.esercitazione2.exceptions.StudentNotFoundException;
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

import static org.apache.logging.log4j.ThreadContext.isEmpty;


@RestController
@RequestMapping("/API/students")
public class StudentController {
    @Autowired
    TeamService teamservice;


    @Autowired
    @Qualifier("messageSource")
    MessageSource msg;

    @GetMapping({"","/"})
    List<StudentDTO> all(){
        return teamservice.getAllStudents().stream()
                .map(x->ModelHelper.enrich(x)).collect(Collectors.toList());
    }



    @GetMapping("/{id}")
    StudentDTO getOne(@PathVariable String id){
        StudentDTO c=teamservice.getStudent(id).orElseThrow(()-> new ResponseStatusException(HttpStatus.NOT_FOUND,id));

        return ModelHelper.enrich(c);
    }

    @GetMapping("/{id}/image")
    Image getImage(@PathVariable String id){
        final Optional<StudentDTO> s = teamservice.getStudent(id);
        if(!s.isPresent())
            return null;
        Image img = teamservice.getImage(s.get());
        return img;
    }


    @PostMapping({"","/"})
    StudentDTO addStudent(@Valid @RequestPart("student") StudentDTO dto, @RequestPart(value="image",required=false) MultipartFile file) {

        try {
            if (file==null || file.isEmpty()) {
                if (!teamservice.addStudent(dto, true))
                    throw new ResponseStatusException(HttpStatus.CONFLICT, dto.getId());
            }
            else {
                if (!teamservice.addStudent(dto, true, file))
                    throw new ResponseStatusException(HttpStatus.CONFLICT, dto.getId());
            }
        } catch (IncoherenceException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }catch(AuthenticationServiceException e){
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }

        return ModelHelper.enrich(dto);
    }

    @PostMapping({"/many"})
    List<StudentDTO> addStudents(@RequestBody @Valid ValidStudentDTOList students ){
        List<Boolean> res;
        List<StudentDTO> original=students.getList();
        List<StudentDTO> finalRes=new ArrayList<>();
        try {
            res=teamservice.addAll(original,true);
        } catch (IncoherenceException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }catch(AuthenticationServiceException e){
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }


        for (int i=0;i<res.size(); i++) {
            if (res.get(i))
                finalRes.add(ModelHelper.enrich(original.get(i)));
        }
        return finalRes;
    }

    @GetMapping("/courses")
    List<CourseDTO> getCourses(){
        try {
            return teamservice.getCourses(SecurityContextHolder.getContext().getAuthentication().getName()).stream()
                    .map(x->ModelHelper.enrich(x)).collect(Collectors.toList());
        }catch (StudentNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    @GetMapping("/teams")
    List<TeamDTO> getTeams() {
        try {
            return teamservice.getTeamsforStudent(SecurityContextHolder.getContext().getAuthentication().getName());

        } catch (StudentNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
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
