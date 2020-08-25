package it.polito.ai.esercitazione2.controllers;


import it.polito.ai.esercitazione2.dtos.*;
import it.polito.ai.esercitazione2.entities.Image;
import it.polito.ai.esercitazione2.exceptions.AuthenticationServiceException;
import it.polito.ai.esercitazione2.exceptions.CourseNotFoundException;
import it.polito.ai.esercitazione2.exceptions.IncoherenceException;
import it.polito.ai.esercitazione2.exceptions.StudentNotFoundException;
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
@RequestMapping("/API/students")
public class StudentController {
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

    @GetMapping({"","/"})
    public List<StudentDTO> all(){
        return teamservice.getAllStudents().stream()
                .map(x->ModelHelper.enrich(x)).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public StudentDTO getOne(@PathVariable String id){
        StudentDTO c=teamservice.getStudent(id).orElseThrow(()-> new ResponseStatusException(HttpStatus.NOT_FOUND,id));

        return ModelHelper.enrich(c);
    }

    @PostMapping({"","/"})
    public StudentDTO addStudent(@Valid @RequestPart("student") StudentDTO dto,
                          @RequestPart(value="image",required=false) MultipartFile file) {

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
    public List<StudentDTO> addStudents(@RequestBody @Valid ValidStudentDTOList students ){
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
    public List<CourseDTO> getCourses(){
        try {
            return teamservice.getCourses(SecurityContextHolder.getContext().getAuthentication().getName()).stream()
                    .map(x->ModelHelper.enrich(x)).collect(Collectors.toList());
        }catch (StudentNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    /**
     * Metodo usato per ricercare i team di uno studente.
     * @return i team del determinato studente che effettua la richiesta
     */
    @GetMapping("/teams")
    public List<TeamDTO> getTeams() {
        try {
            return teamservice.getTeamsforStudent(SecurityContextHolder.getContext().getAuthentication().getName())
                    .stream()
                    .filter(t -> t.getStatus() == 1)
                    .map(t -> ModelHelper.enrich(t, teamservice.getTeamCourse(t.getId())))
                    .collect(Collectors.toList());

        } catch (StudentNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    @GetMapping("/image")
    public Image getProfileImage(){
        Image img = teamservice.getProfileImage();
        return img;
    }

    @GetMapping("/courses/{name}/team")
    public TeamDTO getTeamForCourse(@PathVariable String name){
        try {
            List<TeamDTO> teams = teamservice.getTeamsforStudentAndCourse(SecurityContextHolder.getContext().getAuthentication().getName(), name)
                    .stream()
                    .filter(t -> t.getStatus() == 1)
                    .map(t -> ModelHelper.enrich(t, name))
                    .collect(Collectors.toList());
            if(teams.size()>1)
                throw new ResponseStatusException(HttpStatus.CONFLICT, "More than one team active for this course");
            if(teams.size()==0)
                throw new ResponseStatusException(HttpStatus.EXPECTATION_FAILED, "No team found");
            return teams.get(0);

        } catch (StudentNotFoundException | CourseNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    @GetMapping("/courses/{name}/teamsProposals")
    public  List<TeamDTO> getTeamsProposalsForCourse(@PathVariable String name){
        try {
            return teamservice.getTeamsforStudentAndCourse(SecurityContextHolder.getContext().getAuthentication().getName(), name)
                    .stream()
                    .peek(x -> {
                        if(x.getStatus()==1)
                            throw new ResponseStatusException(HttpStatus.EXPECTATION_FAILED,
                                    "Student " + SecurityContextHolder.getContext().getAuthentication().getName()
                                            + " already has an active team for course " + name);
                    })
                    .filter(t -> t.getStatus() == 0)
                    .map(t -> ModelHelper.enrich(t, name))
                    .collect(Collectors.toList());

        } catch (StudentNotFoundException | CourseNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    @GetMapping("/{id}/assignments")
    public List<AssignmentDTO> getAssignments(@PathVariable String id){
        try{
            return assignmentService.getByStudent(id)
                    .stream()
                    .map(x -> ModelHelper.enrich(x))
                    .collect(Collectors.toList());
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
    }

    @GetMapping("/{id}/assignments/{aId}/")
    public AssignmentDTO getAssignment(@PathVariable String id, @PathVariable Integer aId){
        try{
            String course = assignmentService.getAssignmentCourse(aId);
            return courseController.getAssignment(course, aId);
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
    }

    @GetMapping("/{id}/assignments/{aId}/course")
    public String getAssignmentCourse(@PathVariable("aId") Integer aId){
        try{
            return assignmentService.getAssignmentCourse(aId);
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
    }

    @GetMapping("/{id}/homeworks")
    public List<HomeworkDTO> getHomeworks(@PathVariable String id){
        try{
            return assignmentService.getByStudent(id)
                    .stream()
                    .flatMap(a -> assignmentService.getAssignmentHomeworks(a.getId()).stream())
                    .map(x -> ModelHelper.enrich(x))
                    .collect(Collectors.toList());
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
    }

    @GetMapping("/{id}/homeworks/{hId}/")
    public HomeworkDTO getHomework(@PathVariable String id, @PathVariable Integer hId){
        try{
            String course = homeworkService.getHomeworkCourse(hId);
            Integer aId = homeworkService.getAssignmentId(hId);
            return courseController.getHomework(course, aId, hId);
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
    }

    @GetMapping("/{id}/homeworks/{hId}/course")
    public String getHomeworkCourse(@PathVariable("hId") Integer hId){
        try{
            return homeworkService.getHomeworkCourse(hId);
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
