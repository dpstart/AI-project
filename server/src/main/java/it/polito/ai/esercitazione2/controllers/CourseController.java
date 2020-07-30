package it.polito.ai.esercitazione2.controllers;

import it.polito.ai.esercitazione2.dtos.*;
import it.polito.ai.esercitazione2.entities.Image;
import it.polito.ai.esercitazione2.exceptions.*;

import it.polito.ai.esercitazione2.services.AssignmentService;
import it.polito.ai.esercitazione2.services.HomeworkService;
import it.polito.ai.esercitazione2.services.TeamService;

import it.polito.ai.esercitazione2.services.VMService;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.MessageSource;
import org.springframework.context.NoSuchMessageException;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;


import org.springframework.security.access.AuthorizationServiceException;
import org.springframework.security.core.parameters.P;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.Valid;
import java.io.*;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/API/courses")
public class CourseController {
    @Autowired
    TeamService teamService;

    @Autowired
    VMService vmService;

    @Autowired
    AssignmentService assignmentService;

    @Autowired
    HomeworkService homeworkService;

    @Autowired
    @Qualifier("messageSource")
    MessageSource msg;

    @GetMapping({"","/"})
    List<CourseDTO> all(){
        return teamService.getAllCourses().stream()
                .map(x->ModelHelper.enrich(x)).collect(Collectors.toList());
    }

    @GetMapping("/{name}")
    CourseDTO getOne(@PathVariable String name){
        CourseDTO c= teamService.getCourse(name).orElseThrow(()-> new ResponseStatusException(HttpStatus.NOT_FOUND,name));
        return ModelHelper.enrich(c);
    }

    @PostMapping("/{name}/share")
    void share(@PathVariable String name,@RequestBody Map<String,String> input){
        if (!input.containsKey("id") || input.keySet().size()>1)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Expected only one field: usage 'id':<professorsId>");
        String user=input.get("id");
        try {
            teamService.shareOwnership(name,user);
        }
        catch(IncoherenceException e){
            throw new ResponseStatusException(HttpStatus.CONFLICT,e.getMessage());
        }
        catch(AuthorizationServiceException e){
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,e.getMessage());
        }
        catch(TeamServiceException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }
    }

    @GetMapping("/{name}/enrolled")
    List<StudentDTO> enrolledStudents(@PathVariable String name){
        try {
            return teamService.getEnrolledStudents(name)
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
            if (!teamService.addCourse(dto))
                throw new ResponseStatusException(HttpStatus.CONFLICT, dto.getName());
        }catch(ProfessorNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }

        return ModelHelper.enrich(dto);
    }

    @GetMapping("/{name}/remove")
    void removeCourse(@PathVariable String name){
        try {
            teamService.removeCourse(name);
        }
        catch(CourseAuthorizationException e){
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,e.getMessage());
        }
        catch(CourseEnabledException e){
            throw new ResponseStatusException(HttpStatus.PRECONDITION_REQUIRED,e.getMessage());
        }
        catch (CourseNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }
    }

    @PostMapping("/update")
    CourseDTO updateCourse(@Valid @RequestBody CourseDTO dto){
        try {
            return teamService.updateCourse(dto);
        }
        catch(CourseAuthorizationException e){
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,e.getMessage());
        }
        catch(TeamSizeConstraintsException e){
            throw new ResponseStatusException(HttpStatus.CONFLICT,e.getMessage());
        }
        catch (CourseNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }
        catch (IncoherenceException e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
    }

    @GetMapping("/{name}/enable")
    public void enableCourse(@PathVariable String name){
        try{
            teamService.enableCourse(name);
        }catch(CourseNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }catch (CourseAuthorizationException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        }
    }
    @GetMapping("/{name}/disable")
    public  void disableCourse(@PathVariable String name){
        try{
            teamService.disableCourse(name);
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
            vmService.defineVMModel(name,input.get("model"));
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
            if (!teamService.addStudentToCourse(id, name))
                throw new ResponseStatusException(HttpStatus.CONFLICT, id);
        }catch (CourseAuthorizationException e){
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,e.getMessage());
        }
        catch(TeamServiceException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }
    }

    @PostMapping("/{name}/unsubscribeOne")
    @ResponseStatus(HttpStatus.CREATED)
    void unsubscribeOne(@PathVariable String name, @RequestBody Map<String,String> input){
        if (!input.containsKey("id") || input.get("id").isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Please valorize the key ID");
        if (input.keySet().size()>1)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Received more keys then expected");
        String id=input.get("id");

        try {
            if (!teamService.removeStudentFromCourse(id, name))
                throw new ResponseStatusException(HttpStatus.CONFLICT, id);
        }catch (CourseAuthorizationException e){
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,e.getMessage());
        }
        catch(TeamServiceException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }
    }

    @PostMapping("/{name}/unsubscribeMany")
    @ResponseStatus(HttpStatus.CREATED)
    void unsubscribeStudents(@PathVariable String name, @RequestBody Map<String,Object> input){

        if (!input.containsKey("students"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Missing 'students' key'");

        if (input.keySet().size()>1)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"More keys then expected");

        List<String> students=(List<String>)input.get("students");

        try  {
            teamService.unsubscribeAll(students, name);
        }  catch(StudentNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage()+" Ask the administrator to add it!");
        } catch(CourseAuthorizationException e){
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,e.getMessage());
        }catch (TeamServiceException e){
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
            teamService.enrollAll(students, name);
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
            teamService.enrollCSV(reader, name);
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
            teamService.addAndEnroll(reader,name);
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

        if (!input.containsKey("timeout"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Missing members timeout");

        if (input.keySet().size()>3)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"More keys then expected");

        List<String> members=(List<String>)input.get("members");
        String team=input.get("team").toString().trim();
        Long duration=(Long)input.get("timeout");

        if (team.isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Specify a valid team name");

        //almeno 10 minuti
        if (duration<=(60*1000*10)){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Impossible to set a tiemout less than 10 minutes");
        }


        try {
            TeamDTO t= teamService.proposeTeam(name, team, members,duration);
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
            return teamService.getTeamForCourse(name).stream().map(x->ModelHelper.enrich(x,name)).collect(Collectors.toList());
        }
        catch(CourseNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }
    }

    @GetMapping("/{name}/teams/{id}")
    TeamDTO getTeam(@PathVariable String name,@PathVariable Long id){
        try {
            return ModelHelper.enrich(teamService.getOneTeamForCourse(name,id),name);
        }
        catch(TeamServiceException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }
    }

    @PostMapping("/{name}/teams/{teamId}/createVM")
    VMDTO createVM(@PathVariable Long teamId, @RequestPart(value="image") MultipartFile file, @Valid @RequestPart("settings") SettingsDTO settings){
        if (settings.getMax_active()==null) //contemporary active
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "'Max active' field not expected here");
        if (settings.getMax_available()==null) //active + off
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "'Max available' field not expected here");

        try{
            return vmService.createVM(teamId,file,settings);
        }
        catch (AuthorizationServiceException e){
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, e.getMessage());  //DA CAMBIARE!!!!
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
            return teamService.setSettings(name, id, settings);
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

    @GetMapping("/{name}/teams/{id}/adhesion")
    Map<String,Boolean> getAdhesionInfo(@PathVariable String name, @PathVariable Long id){
       return teamService.getAdhesionInfo(id);

    }

    @GetMapping("/{name}/teams/{id}/members")
    List<StudentDTO> getTeamMembers(@PathVariable String name,@PathVariable Long id){
        try {
            return teamService.getMembers(name,id).stream().map(x-> ModelHelper.enrich(x)).collect(Collectors.toList());
        }
        catch(TeamServiceException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }
    }

    @GetMapping("/{name}/inTeams")
    List<StudentDTO> getStudentsInTeams(@PathVariable String name){
        try{
            return teamService.getStudentsInTeams(name).stream()
                    .map(x->ModelHelper.enrich(x))
                    .collect(Collectors.toList());
        }catch(CourseNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }

    }

    @GetMapping("/{name}/available")
    List<StudentDTO> getAvailableStudents(@PathVariable String name){
        try{
            return teamService.getAvailableStudents(name).stream()
                    .map(x->ModelHelper.enrich(x))
                    .collect(Collectors.toList());
        }catch(CourseNotFoundException e){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,e.getMessage());
        }
    }

    @GetMapping("/{name}/assignments")
    List<AssignmentDTO> getAssignments(@PathVariable String name){
        try{
            return assignmentService.getByCourse(name)
                    .stream()
                    .map(x -> ModelHelper.enrich(x, name))
                    .collect(Collectors.toList());
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
    }

    @PostMapping("/{name}/assignments")
    public AssignmentDTO addAssignment(@PathVariable String name,
                                       @Valid @RequestPart("assignment") AssignmentDTO dto,
                                       @RequestPart(value="image",required=true) MultipartFile file)
    {
        try{
            AssignmentDTO a = assignmentService.addAssignment(dto, file, name);
            if(a.equals(dto)){
                throw new IncoherenceException("Assignment already exists");
            }
            return ModelHelper.enrich(a, name);
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
    }

    @GetMapping("/{name}/assignments/{id}")
    AssignmentDTO getAssignment(@PathVariable String name, @PathVariable Integer id){
        try{
            return ModelHelper.enrich(assignmentService.getAssignment(id), name);
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
    }

    @DeleteMapping("/{name}/assignments/{id}")
    void removeAssignment(@PathVariable String name, @PathVariable Integer id){
        try{
            if(!assignmentService.removeAssignment(id))
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED , "You can only remove assignments if none of the students has read it");
            return;
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
    }

    @GetMapping("/{name}/assignments/{id}/image")
    Image getAssignmentImage(@PathVariable String name, @PathVariable Integer id){
        try{
            return assignmentService.getImage(id);
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
    }

    @GetMapping("/{name}/assignments/{id}/professorId")
    String getAssignmentProfessorId(@PathVariable String name, @PathVariable Integer id){
        try{
            return assignmentService.getAssignmentProfessor(id);
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
    }

    @GetMapping("/{name}/homeworks")
    List<HomeworkDTO> getCourseHomeworks(@PathVariable String name){
        try{
            return assignmentService.getHomeworksByCourse(name)
                    .stream()
                    .map(h -> ModelHelper.enrich(h, name))
                    .collect(Collectors.toList());
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
    }

    @GetMapping("/{name}/homeworks/{id}/assignmentId")
    Integer getHomeworkAssignmentId(@PathVariable String name, @PathVariable Integer id){
        try{
            return homeworkService.getAssignmentId(id);
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
    }

    @GetMapping("/{name}/assignments/{id}/homeworks")
    List<HomeworkDTO> getAssignmentHomeworks(@PathVariable String name, @PathVariable Integer id){
        try{
            return assignmentService.getAssignmentHomeworks(id)
                    .stream()
                    .map(h -> ModelHelper.enrich(h, name))
                    .collect(Collectors.toList());
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
    }

    @GetMapping("/{name}/assignments/{id1}/homeworks/{id2}")
    HomeworkDTO getHomework(@PathVariable String name, @PathVariable Integer id1, @PathVariable Integer id2){
        try{
            return ModelHelper.enrich(homeworkService.getHomework(id2), name, id1);
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
    }

    @PostMapping("/{name}/assignments/{id}")
    HomeworkVersionDTO uploadHomework(@PathVariable String name, @PathVariable Integer id,
                               @RequestPart(value="image",required=true) MultipartFile file){
        try{
            HomeworkDTO h = homeworkService.uploadHomework(id, file);
            return getHomeworkLatestVersion(name, id, h.getId());
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
    }

    @GetMapping("/{name}/assignments/{id1}/homeworks/{id2}/versions")
    List<HomeworkVersionDTO> getHomeworkVersions(@PathVariable String name, @PathVariable Integer id1, @PathVariable Integer id2){
        try{
            List<Image> versions = homeworkService.getAllImages(id2);
            List<HomeworkVersionDTO> enriched = new ArrayList<>();
            for(int i=0; i< versions.size(); i++){
                enriched.add(ModelHelper.enrich(versions.get(i), name, id1, id2, i));
            }
            return enriched;
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
    }

    @GetMapping("/{name}/assignments/{id1}/homeworks/{id2}/versions/{id3}")
    HomeworkVersionDTO getHomeworkVersion(@PathVariable String name,
                                    @PathVariable Integer id1,
                                    @PathVariable Integer id2,
                                    @PathVariable Integer id3){
        try{
            return ModelHelper.enrich(homeworkService.getImage(id2, id3), name, id1, id2, id3);
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
    }

    @GetMapping("/{name}/assignments/{id1}/homeworks/{id2}/versions/{id3}/date")
    Timestamp getHomeworkVersionDeliveryDate(@PathVariable String name,
                                 @PathVariable Integer id1,
                                 @PathVariable Integer id2,
                                 @PathVariable Integer id3){
        try{
            return homeworkService.getDeliveryDate(id2, id3);
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
    }

    @GetMapping("/{name}/assignments/{id1}/homeworks/{id2}/versions/latest")
    HomeworkVersionDTO getHomeworkLatestVersion(@PathVariable String name,
                             @PathVariable Integer id1,
                             @PathVariable Integer id2){
        try{
            return ModelHelper.enrich(homeworkService.getImage(id2), name, id1, id2);
        }
        catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,e.getMessage());
        }
    }

    @GetMapping("/{name}/assignments/{id1}/homeworks/{id2}/studentId")
    String getHomeworkStudentId(@PathVariable String name, @PathVariable Integer id1, @PathVariable Integer id2){
        try{
            return homeworkService.getHomeworkStudentId(id2);
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
