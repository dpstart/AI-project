package it.polito.ai.esercitazione2.controllers;

import it.polito.ai.esercitazione2.dtos.*;
import it.polito.ai.esercitazione2.exceptions.*;

import it.polito.ai.esercitazione2.services.TeamService;

import it.polito.ai.esercitazione2.services.VMService;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.MessageSource;
import org.springframework.context.NoSuchMessageException;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;


import org.springframework.security.access.AuthorizationServiceException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.Valid;
import java.io.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/API/courses")
public class CourseController {
    @Autowired
    TeamService teamservice;

    @Autowired
    VMService vmservice;


    @Autowired
    @Qualifier("messageSource")
    MessageSource msg;

    @GetMapping({"","/"})
    List<CourseDTO> all(){
        return teamservice.getAllCourses().stream()
                .map(x->ModelHelper.enrich(x)).collect(Collectors.toList());
    }

    @GetMapping("/{name}")
    CourseDTO getOne(@PathVariable String name){
        CourseDTO c=teamservice.getCourse(name).orElseThrow(()-> new ResponseStatusException(HttpStatus.NOT_FOUND,name));
        return ModelHelper.enrich(c);
    }

    @GetMapping("/{name}/enrolled")
    List<StudentDTO> enrolledStudents(@PathVariable String name){
        try {
            return teamservice.getEnrolledStudents(name)
                    .stream()
                    .map(x -> ModelHelper.enrich(x))
                    .collect(Collectors.toList());
        }
        catch(CourseNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }
    }

    @PostMapping({"","/"})
    CourseDTO addCourse(@Valid @RequestBody CourseDTO dto){

        try {
            if (!teamservice.addCourse(dto))
                throw new ResponseStatusException(HttpStatus.CONFLICT, dto.getName());
        }catch(ProfessorNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }

        return ModelHelper.enrich(dto);
    }

    @GetMapping("/{name}/enable")
    public void enableCourse(@PathVariable String name){
        try{
            teamservice.enableCourse(name);
        }catch(CourseNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }catch (CourseAuthorizationException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        }
    }
    @GetMapping("/{name}/disable")
    public  void disableCourse(@PathVariable String name){
        try{
            teamservice.disableCourse(name);
        }catch(CourseNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }catch (CourseAuthorizationException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        }
    }

    @PostMapping("/{name}/model")  // ragionare su se è più logico accedere direttamente a qualuenue team perdendo il riferimento al corso oppure /APU/courses/PDS/{teamID}
    void defineVMmodelForACourse(@PathVariable String name, @RequestBody Map<String,String> input){
        if (!input.containsKey("model") || input.keySet().size()>1){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Expected one parameter: usage 'model':<modelName>");
        }

        try{
            vmservice.defineVMModel(name,input.get("model"));
        }
        catch (AuthorizationServiceException e){
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());  //DA CAMBIARE!!!!
        }
        catch(IncoherenceException e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
        catch (TeamServiceException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }

    }

    @PostMapping("/{name}/enrollOne")
    @ResponseStatus(HttpStatus.CREATED)
    void enrollOne(@PathVariable String name, @RequestBody Map<String,String> input){
        if (!input.containsKey("id") || input.get("id").isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Please valorize the key ID");
        if (input.keySet().size()>1)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Received more keys then expected");
        String id=input.get("id");

        try {
            if (!teamservice.addStudentToCourse(id, name))
                throw new ResponseStatusException(HttpStatus.CONFLICT, id);
        }catch (CourseAuthorizationException e){
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,e.getMessage());
        }
        catch(TeamServiceException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }
    }
    @PostMapping("/{name}/enrollMany")
    @ResponseStatus(HttpStatus.CREATED)
    void enrollStudents(@PathVariable String name, @RequestBody Map<String,Object> input){

        if (!input.containsKey("students"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Missing 'students' key'");

        if (input.keySet().size()>1)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"More keys then expected");

        List<String> students=(List<String>)input.get("students");

        try  {
            teamservice.enrollAll(students, name);
        }  catch(StudentNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage()+" Ask the administrator to add it!");
        } catch(CourseAuthorizationException e){
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,e.getMessage());
        }catch (TeamServiceException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }

    }

    @PostMapping("/{name}/enrollManyCSV")
    @ResponseStatus(HttpStatus.CREATED)
    void enrollStudentsCSV(@PathVariable String name, @RequestParam("file") MultipartFile file){

        if (!file.getContentType().equals("text/csv"))
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,file.getName());


        try (Reader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            teamservice.enrollCSV(reader, name);
        } catch (IncoherenceException e){
            throw new ResponseStatusException(HttpStatus.CONFLICT,e.getMessage());
        } catch(IOException e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }catch(CourseAuthorizationException e){
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,e.getMessage());
        }catch (TeamServiceException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }

    }

    @PostMapping("/{name}/addEnrollMany")
    @ResponseStatus(HttpStatus.CREATED)
    void addEnrollStudents(@PathVariable String name, @RequestParam("file") MultipartFile file){
        if (!file.getContentType().equals("text/csv"))
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,file.getName());

        try (Reader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            teamservice.addAndEnroll(reader,name);
        } catch (IncoherenceException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }catch (NotExpectedStatusException e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        } catch(IOException e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }catch (AuthenticationServiceException e){
            throw new ResponseStatusException(HttpStatus.CONFLICT,e.getMessage());
        }catch(CourseAuthorizationException e){
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,e.getMessage());
        }catch (TeamServiceException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }
    }

    @PostMapping("/{name}/proposeTeam")
    @ResponseStatus(HttpStatus.CREATED)
    void proposeTeam(@PathVariable String name, @RequestBody Map<String,Object> input){
        if (!input.containsKey("team"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Missing team key");

        if (!input.containsKey("members"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Missing members key");

        if (input.keySet().size()>2)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"More keys then expected");

        List<String> members=(List<String>)input.get("members");
        String team=input.get("team").toString().trim();

        if (team.isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Specify a valid team name");


        try {
            TeamDTO t=teamservice.proposeTeam(name, team, members);
        }
        catch (AlreadyInACourseTeamException e){
            throw new ResponseStatusException(HttpStatus.CONFLICT,e.getMessage());
        } catch (DuplicatePartecipantsException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }catch(ProposerNotPartOfTheTeamException e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
        catch (TeamSizeConstraintsException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());

        }catch (TeamNameAlreadyPresentInCourse e){
            throw new ResponseStatusException(HttpStatus.CONFLICT,e.getMessage());
        }
        catch(TeamServiceException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }

    }

    @GetMapping("/{name}/teams")
    List<TeamDTO> getTeams(@PathVariable String name){
        try {
            return teamservice.getTeamForCourse(name).stream().map(x->ModelHelper.enrich(x,name)).collect(Collectors.toList());
        }
        catch(CourseNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }
    }

    @GetMapping("/{name}/teams/{id}")
    TeamDTO getTeam(@PathVariable String name,@PathVariable Long id){
        try {
            return ModelHelper.enrich(teamservice.getOneTeamForCourse(name,id),name);
        }
        catch(TeamServiceException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }
    }

    @PostMapping("/{name}/teams/{teamId}/settings/createVM")
    VMDTO createVM(@PathVariable Long teamId, @RequestPart(value="image") MultipartFile file, @Valid @RequestPart("settings") SettingsDTO settings){
        if (settings.getMax_active()==null) //contemporary active
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "'Max active' field not expected here");
        if (settings.getMax_available()==null) //active + off
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "'Max available' field not expected here");

        try{
            return vmservice.createVM(teamId,file,settings);
        }
        catch (AuthorizationServiceException e){
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());  //DA CAMBIARE!!!!
        }
        catch ( TeamNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }
        catch ( UnavailableResourcesForTeamException e){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,e.getMessage());
        }

    }

    @PostMapping("/{name}/teams/{id}/settings")
    TeamDTO setSettings(@PathVariable String name, @PathVariable Long id, @Valid @RequestBody SettingsDTO settings){
        if (settings.getMax_active()==null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Please specify 'max_axtive' field"); //da generalizzare
        if (settings.getMax_available()==null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Please specify 'max_available' field"); //da generalizzare


        try {
            return teamservice.setSettings(name, id, settings);
        } catch(CourseNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }catch(CourseAuthorizationException e){
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,e.getMessage());
        }catch (TeamNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        } catch( NotExpectedStatusException e ){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }catch (IncoherenceException e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }

    }

    @GetMapping("/{name}/teams/{id}/members")
    List<StudentDTO> getTeamMembers(@PathVariable String name,@PathVariable Long id){
        try {
            return teamservice.getMembers(name,id).stream().map(x-> ModelHelper.enrich(x)).collect(Collectors.toList());
        }
        catch(TeamServiceException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }
    }

    @GetMapping("/{name}/inTeams")
    List<StudentDTO> getStudentsInTeams(@PathVariable String name){
        try{
            return teamservice.getStudentsInTeams(name).stream()
                    .map(x->ModelHelper.enrich(x))
                    .collect(Collectors.toList());
        }catch(CourseNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }

    }

    @GetMapping("/{name}/available")
    List<StudentDTO> getAvailableStudents(@PathVariable String name){
        try{
            return teamservice.getAvailableStudents(name).stream()
                    .map(x->ModelHelper.enrich(x))
                    .collect(Collectors.toList());
        }catch(CourseNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
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
