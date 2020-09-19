package it.polito.ai.esercitazione2.controllers;

import com.opencsv.exceptions.CsvValidationException;
import it.polito.ai.esercitazione2.dtos.*;
import it.polito.ai.esercitazione2.exceptions.*;

import it.polito.ai.esercitazione2.services.*;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.MessageSource;
import org.springframework.context.NoSuchMessageException;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;


import org.springframework.security.access.AuthorizationServiceException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.Valid;
import java.io.*;

import java.sql.Timestamp;
import java.util.*;

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


    /************************************************************************************************************************************************************************
     ***************************************************************************GENERAL COURSES MANAGEMENT*******************************************************************
     ************************************************************************************************************************************************************************/

    /**
     * Add new course
     * Authentication required: professor
     *
     * @param dto: {
     *             "name":"Applicazioni Internet",
     *             "acronime":"AI",
     *             "max":10
     *             "min": optional
     *             }
     * @return the courseDTO created
     */
    @PostMapping({"", "/"})
    CourseDTO addCourse(@Valid @RequestBody CourseDTO dto) {

        try {
            if (!teamService.addCourse(dto))
                throw new ResponseStatusException(HttpStatus.CONFLICT, dto.getName());
        } catch (ProfessorNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }

        return ModelHelper.enrich(dto);
    }

    /**
     * Remove existing course
     * Authentication required: professor owning the course
     *
     * @param name: name of the course (path variable)
     * @return void
     */
    @DeleteMapping("/{name}")
    void removeCourse(@PathVariable String name) {
        try {
            teamService.removeCourse(name);
        } catch (CourseAuthorizationException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (CourseEnabledException e) {
            throw new ResponseStatusException(HttpStatus.PRECONDITION_REQUIRED, e.getMessage());
        } catch (CourseNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    /**
     * Add other professors to the course
     * Authentication required: professor owning the course
     *
     * @param name:  name of the course to share (path variable);
     * @param input: {
     *               "id": {id of the professor}
     *               }
     * @return void
     */
    @PostMapping("/{name}/share")
    void share(@PathVariable String name, @RequestBody Map<String, String> input) {
        if (!input.containsKey("id") || input.keySet().size() > 1)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Expected only one field: usage 'id':<professorsId>");
        String user = input.get("id");
        try {
            teamService.shareOwnership(name, user);
        } catch (IncoherenceException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        } catch (AuthorizationServiceException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (TeamServiceException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    /**
     * Get the professors not engaged in this course
     * Authentication required: professor owning the course
     *
     * @param name:  name of the course to share (path variable);
     *
     * @return list of avilable ProfessorDTO
     */
    @GetMapping("/{name}/professors/available")
    List<ProfessorDTO> getProfessorsNotInCourse(@PathVariable String name){
        try {
            return teamService.getProfessorNotInCourse(name);
        } catch (CourseNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (AuthorizationServiceException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, e.getMessage());
        }
    }


    /**
     * Get all courses
     * Authentication required: any user
     *
     * @param
     * @return list of courseDTO
     */
    @GetMapping({"", "/"})
    List<CourseDTO> all() {
        return teamService.getAllCourses().stream()
                .map(ModelHelper::enrich).collect(Collectors.toList());
    }

    /**
     * Get one course
     * Authentication required: any user
     *
     * @param name: name of the course to return (path variable)
     * @return courseDTO
     */
    @GetMapping("/{name}")
    CourseDTO getOne(@PathVariable String name) {
        CourseDTO c = teamService.getCourse(name).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, name));
        return ModelHelper.enrich(c);
    }

    /**
     * Course activation
     * Authentication required: professor owning the course
     *
     * @param name: name of the course to enable (path variable);
     * @return void
     */
    @PostMapping("/{name}/enable")
    public void enableCourse(@PathVariable String name) {
        try {
            teamService.enableCourse(name);
        } catch (CourseNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (CourseAuthorizationException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        }
    }

    /**
     * Course deactivation
     * Authentication required: professor owning the course
     *
     * @param name: name of the course to disable (path variable);
     * @return void
     */
    @PostMapping("/{name}/disable")
    public void disableCourse(@PathVariable String name) {
        try {
            teamService.disableCourse(name);
        } catch (CourseNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (CourseAuthorizationException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        }
    }

    /**
     * Update course details, except the name
     * Authentication required: professor owning the course
     *
     * @param dto: {
     *             "name":"Applicazioni Internet",
     *             "acronime":"AI",
     *             "max":10
     *             "min": optional
     *             }
     * @return updated Course
     */
    @PutMapping("/update")
    CourseDTO updateCourse(@Valid @RequestBody CourseDTO dto) {
        try {
            return teamService.updateCourse(dto);
        } catch (CourseAuthorizationException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (TeamSizeConstraintsException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        } catch (CourseNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (IncoherenceException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /************************************************************************************************************************************************************************
     ***************************************************************************STUDENTS ENROLLMENT IN THE COURSE ***********************************************************
     ************************************************************************************************************************************************************************/

    /**
     * Enroll one student in the course
     * Authentication required: professor owning the course
     *
     * @param name:  name of the course (path variable)
     * @param input: {
     *               "id": {student id}
     *               }
     * @return void
     */
    @PostMapping("/{name}/enrollOne")
    @ResponseStatus(HttpStatus.CREATED)
    void enrollOne(@PathVariable String name, @RequestBody Map<String, String> input) {
        if (!input.containsKey("id") || input.get("id").isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please valorize the key ID");
        if (input.keySet().size() > 1)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Received more keys then expected");
        String id = input.get("id");

        try {
            if (!teamService.addStudentToCourse(id, name))
                throw new ResponseStatusException(HttpStatus.CONFLICT, id);
        } catch (CourseAuthorizationException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        } catch (TeamServiceException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    /**
     * Enroll a list of students in the course
     * Authentication required: professor owning the course
     *
     * @param name:  name of the course (path variable)
     * @param input: {
     *               "students": ["2000","2001"]  <--- array of student id
     *               }
     * @return void
     */
    @PostMapping("/{name}/enrollMany")
    @ResponseStatus(HttpStatus.CREATED)
    void enrollStudents(@PathVariable String name, @RequestBody Map<String, Object> input) {

        if (!input.containsKey("students"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing 'students' key'");

        if (input.keySet().size() > 1)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "More keys then expected");

        List<String> students = (List<String>) input.get("students");

        try {
            teamService.enrollAll(students, name);
        } catch (StudentNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage() + " Ask the administrator to add it!");
        } catch (CourseAuthorizationException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        } catch (TeamServiceException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }

    }

    /**
     * Enroll a list of students, whose details are contained in a csv file, in the course
     * Authentication required: professor owning the course
     *
     * @param name: name of the course (path variable)
     * @param file: file.csv containing 'id' column with one student id for each row
     * @return void
     */
    @PostMapping("/{name}/enrollManyCSV")
    @ResponseStatus(HttpStatus.CREATED)
    void enrollStudentsCSV(@PathVariable String name, @RequestParam("file") MultipartFile file) {

        if (!file.getContentType().equals("text/csv"))
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, file.getName());


        try (Reader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            teamService.enrollCSV(reader, name);
        } catch (IOException | CsvValidationException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (CourseAuthorizationException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        } catch (TeamServiceException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }

    }

    /**
     * Remove students from the course
     * Authentication required: professor owning the course
     *
     * @param name: name of the course (path variable)
     * @param input: {
     *               "students":["2000","2001",...] <-- array of student ids
     *               }
     * @return void
     */
    @PostMapping("/{name}/unsubscribe")
    @ResponseStatus(HttpStatus.CREATED)
    void unsubscribeStudents(@PathVariable String name, @RequestBody Map<String, Object> input) {

        if (!input.containsKey("students"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing 'students' key'");

        if (input.keySet().size() > 1)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "More keys then expected");

        List<String> students = (List<String>) input.get("students");

        try {
            teamService.unsubscribe(students, name);
        } catch (StudentNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (CourseAuthorizationException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (TeamServiceException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }

    }

    /**
     * Get list of the students enrolled in the course
     * Authentication required: any user
     *
     * @param name: name of the course (path variable)
     * @return list of enrolled students
     */
    @GetMapping("/{name}/enrolled")
    List<StudentDTO> enrolledStudents(@PathVariable String name) {
        try {
            return teamService.getEnrolledStudents(name)
                    .stream()
                    .map(ModelHelper::enrich)
                    .collect(Collectors.toList());
        } catch (CourseNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }



    /************************************************************************************************************************************************************************
     ********************************************************************************TEAM MANAGEMENT*************************************************************************
     ************************************************************************************************************************************************************************/


    /**
     * Propose a team for the course
     * Authentication required: student enrolled in the course
     *
     * @param name:  name of the course (path variable)
     * @param input: {
     *               "team":"FirstTeam",
     *               "members":["2000","2001","2002","2003"],
     *               "timeout": 600000
     *               }
     * @return void
     */
    @PostMapping("/{name}/proposeTeam")
    @ResponseStatus(HttpStatus.CREATED)
    void proposeTeam(@PathVariable String name, @RequestBody Map<String, Object> input) {

        //check on the format of the input received
        if (!input.containsKey("team"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing team key");

        if (!input.containsKey("members"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing members key");

        if (!input.containsKey("timeout"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing members timeout");

        if (input.keySet().size() > 3)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "More keys then expected");


        try {
            //list of members to invite
            List<String> members = (List<String>) input.get("members");
            //name of the team
            String team = input.get("team").toString().trim();

            //expiration time
            Long duration = ((Integer) input.get("timeout")).longValue() * 1000 * 60;

            if (team.isEmpty())
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Specify a valid team name");

            //not possible to set a timeout less than 10 minutes
            if (duration < (60 * 1000 * 10)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Impossible to set a tiemout less than 10 minutes");
            }
            TeamDTO t = teamService.proposeTeam(name, team, members, duration);
        } catch (AlreadyInACourseTeamException | TeamNameAlreadyPresentInCourse e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        } catch (DuplicatePartecipantsException | ProposerNotPartOfTheTeamException | TeamSizeConstraintsException | ClassCastException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (TeamServiceException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }

    }

    /**
     * Get all course teams
     * Authentication required: user enrolled in the course
     * @param name: name of the course (path variable)
     *
     * @return list of TeamDTO
     */
    @GetMapping("/{name}/teams")
    List<TeamDTO> getTeams(@PathVariable String name) {
        try {
            return teamService.getTeamForCourse(name).stream().map(x -> ModelHelper.enrich(x, name)).collect(Collectors.toList());
        } catch (CourseNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }  catch (CourseAuthorizationException e){
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, e.getMessage());
        }
    }

    /**
     * Get one team of the course
     * Authentication required: user enrolled in the course
     *
     * @param name: name of the course (path variable)
     * @param id:   team id (path variable)
     * @return TeamDTO
     */
    @GetMapping("/{name}/teams/{id}")
    TeamDTO getTeam(@PathVariable String name, @PathVariable Long id) {
        try {
            return ModelHelper.enrich(teamService.getOneTeamForCourse(name, id), name);

        } catch (CourseAuthorizationException e){
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, e.getMessage());
        }catch (TeamServiceException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    /**
     * Get team adhesion status info with token for logged user
     * Authentication required: student in the team
     *
     * @param name: name of the course (path variable)
     * @param id: team id (path varaible)
     * @return {
     * "2000": "true"
     * "2001": "false"
     * "2002": "token" (if "2002" is authenticated user's id and he hasn't accepted the proposal yet)
     * }
     */
    @GetMapping("/{name}/teams/{id}/adhesion")
    Map<String, String> getAdhesionInfo(@PathVariable String name, @PathVariable Long id) {
        try {
            return teamService.getAdhesionInfo(id);
        } catch (AuthorizationServiceException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, e.getMessage());
        }


    }


    /**
     * Get team's members
     * Authentication required: student in the course or professor of the course
     * @param name: name of the course (path variable)
     * @param id: team id (path varaible)
     *
     * @return  list of studentDTO enrolled in the team
     *
     */
    @GetMapping("/{name}/teams/{id}/members")
    List<StudentDTO> getTeamMembers(@PathVariable String name, @PathVariable Long id) {
        try {
            return teamService.getMembers(name, id).stream().map(ModelHelper::enrich).collect(Collectors.toList());
        } catch (CourseAuthorizationException e){
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (TeamServiceException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    /**
     * Get already in-team students
     * Authentication required: student enrolled in the course or professor of the course
     * @param name: name of the course (path variable)
     *
     * @return list of busy students
     */
    @GetMapping("/{name}/inTeams")
    List<StudentDTO> getStudentsInTeams(@PathVariable String name) {
        try {
            return teamService.getStudentsInTeams(name).stream()
                    .map(ModelHelper::enrich)
                    .collect(Collectors.toList());
        } catch (CourseNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (CourseAuthorizationException e){
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, e.getMessage());
        }

    }

    /**
     * Get students available for team proposals
     * Authentication required: student enrolled in the course or professor of the course
     * @param name: name of the course (path variable)
     *
     * @return list of available students
     */
    @GetMapping("/{name}/available")
    List<StudentDTO> getAvailableStudents(@PathVariable String name) {
        try {
            return teamService.getAvailableStudents(name).stream()
                    .map(ModelHelper::enrich)
                    .collect(Collectors.toList());
        } catch (CourseNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }  catch (AuthorizationServiceException e){
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, e.getMessage());
        }
    }



    /************************************************************************************************************************************************************************
     ********************************************************************************GESTIONE VM MODEL & VM INSTANCES*************************************************************************
     ************************************************************************************************************************************************************************/



    /**
     * Add a new model of vm for a course
     * Authentication required: professor of the course
     * @param name: name of the course (path variable)
     * @param input: {
     *                  "model":"macOS High Sierra"
     *               }
     *
     * @return void
     */
    @PostMapping("/{name}/model")
    void defineVMmodelForACourse(@PathVariable String name, @RequestBody Map<String, String> input) {
        if (!input.containsKey("model") || input.keySet().size() > 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Expected one parameter: usage 'model':<modelName>");
        }

        try {
            vmService.defineVMModel(name, input.get("model"));
        } catch (AuthorizationServiceException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, e.getMessage());
        } catch (IncoherenceException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (TeamServiceException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }

    }

    /**
     * Modify settings for a vm for a team in the course
     * Authentication required: professor of the course
     * @param name: name of the course (path variable)
     * @param id: team id (path variable)
     * @param settings: {
     *                      "n_cpu":"10",
     *                      "disk_space":"256",
     *                      "ram":"8",
     *                      "max_active":"5",
     *                      "max_available":"10"
     *                   }
     *
     * @return updated teamDTO
     */
    @PostMapping("/{name}/teams/{id}/settings")
    TeamDTO setSettings(@PathVariable String name, @PathVariable Long id, @Valid @RequestBody SettingsDTO settings) {
        if (settings.getMax_active() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please specify 'max_active' field"); //da generalizzare
        if (settings.getMax_available() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please specify 'max_available' field"); //da generalizzare


        try {
            return teamService.setSettings(name, id, settings);
        } catch (CourseNotFoundException | TeamNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (CourseAuthorizationException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        } catch (NotExpectedStatusException | IncoherenceException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }

    }



    /**
     * Create a vm for a team in the course
     * Authentication required: a student member of the team
     * @param courseName: course name (path variable)
     * @param teamId: teamId (path variable)
     * @param file:  image of the VM (.jpg)
     * @param settings:    settings required for the VM
     *                       {
     *                          "n_cpu":"10",
     *                          "disk_space":"256",
     *                          "ram":"8",
     *
     *                       }
     *
     *
     * @return created VMDTO
     */
    @PostMapping("/{courseName}/teams/{teamId}/createVM")
    VMDTO createVM(@PathVariable String courseName, @PathVariable  Long teamId, @RequestPart(value = "image") MultipartFile file, @Valid @RequestPart("settings") SettingsDTO settings) {

        if (settings.getMax_active() == null) //contemporary active
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "'Max active' field not expected here");
        if (settings.getMax_available() == null) //active + off
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "'Max available' field not expected here");

        try {
            return vmService.createVM(courseName,teamId, file, settings);
        } catch (AuthorizationServiceException|CourseAuthorizationException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, e.getMessage());  //DA CAMBIARE!!!!
        } catch (TeamNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (UnavailableResourcesForTeamException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }

    }





    /************************************************************************************************************************************************************************
     ********************************************************************************ASSIGNMENTS*****************************************************************************
     ************************************************************************************************************************************************************************/


    /**
     * Get all assignments of the course
     * Authentication required: professor of the course or a student enrolled in it
     * @param name: name of the course (path variable)
     *
     * @return list of AssignmentDTO for the course
     */
    @GetMapping("/{name}/assignments")
    List<AssignmentDTO> getAssignments(@PathVariable String name) {
        try {
            return assignmentService.getByCourse(name)
                    .stream()
                    .map(a -> ModelHelper.enrich(a, name, assignmentService.getAssignmentProfessor(a.getId())))
                    .sorted(Comparator.comparing(AssignmentDTO::getReleaseDate))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * Add a new assignment for the course
     * Authentication required: professor of the course
     * @param name: name of the course (path variable)
     *
     * @return added AssignmentDTO
     */
    @PostMapping("/{name}/assignments")
    public AssignmentDTO addAssignment(@PathVariable String name,
                                       @Valid @RequestPart("assignment") AssignmentDTO dto,
                                       @RequestPart(value = "image", required = true) MultipartFile file) {
        try {
            AssignmentDTO a = assignmentService.addAssignment(dto, file, name);
            if (a.equals(dto)) {
                throw new IncoherenceException("Assignment already exists");
            }
            return ModelHelper.enrich(a, name, assignmentService.getAssignmentProfessor(a.getId()));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * Get an assignment of the course
     * Authentication required: professor of the course or a student enrolled in it
     * @param name: name of the course (path variable)
     * @param id: assignment id (path variable)
     *
     * @return requested assignmentDTO
     */
    @GetMapping("/{name}/assignments/{id}")
    AssignmentDTO getAssignment(@PathVariable String name, @PathVariable Integer id) {
        try {
            AssignmentDTO assignment = assignmentService.getAssignment(id);
            return ModelHelper.enrich(assignment, name, assignmentService.getAssignmentProfessor(id));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * Delete an assignment of the course, allowed only if none of the students has read it
     * Authentication required: professor of the course
     * @param name: name of the course (path variable)
     * @param id: assignment id (path variable)
     *
     * @return void
     */
    @DeleteMapping("/{name}/assignments/{id}")
    void removeAssignment(@PathVariable String name, @PathVariable Integer id) {
        try {
            if (!assignmentService.removeAssignment(id))
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "You can only remove assignments if none of the students has read it");
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * Get an assignment image
     * Authentication required: professor of the course or a student enrolled in it
     * @param name: name of the course (path variable)
     * @param id: assignment id (path variable)
     *
     * @return requested assignment's imageDTO
     */
    @GetMapping("/{name}/assignments/{id}/image")
    ImageDTO getAssignmentImage(@PathVariable String name, @PathVariable Integer id) {
        try {
            return ModelHelper.enrich(assignmentService.getImage(id), name, id);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /************************************************************************************************************************************************************************
     ********************************************************************************HOMEWORKS*******************************************************************************
     ************************************************************************************************************************************************************************/


    /**
     * Get all homeworks of the course, student gets only his own
     * Authentication required: professor of the course or a student enrolled in it
     * @param name: name of the course (path variable)
     *
     * @return requested course's list of homeworkDTO
     */
    @GetMapping("/{name}/homeworks")
    List<HomeworkDTO> getCourseHomeworks(@PathVariable String name) {
        try {
            return assignmentService.getHomeworksByCourse(name)
                    .stream()
                    .map(h -> {
                        Integer assignmentId = homeworkService.getAssignmentId(h.getId());
                        String professorId = assignmentService.getAssignmentProfessor(assignmentId);
                        String studentId = homeworkService.getHomeworkStudentId(h.getId());
                        return ModelHelper.enrich(h, name, assignmentId, professorId, studentId);
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * Get all homeworks for the given assignment, student gets only his own (equal to getHomework)
     * Authentication required: professor of the course or a student enrolled in it
     * @param name: name of the course (path variable)
     * @param id: assignment id (path variable)
     *
     * @return requested assignment's list of homeworkDTO, student gets only his own
     */
    @GetMapping("/{name}/assignments/{id}/homeworks")
    List<HomeworkDTO> getAssignmentHomeworks(@PathVariable String name, @PathVariable Integer id) {
        try {
            return assignmentService.getAssignmentHomeworks(id)
                    .stream()
                    .map(h -> {
                        Integer assignmentId = homeworkService.getAssignmentId(h.getId());
                        String professorId = assignmentService.getAssignmentProfessor(assignmentId);
                        String studentId = homeworkService.getHomeworkStudentId(h.getId());
                        return ModelHelper.enrich(h, name, assignmentId, professorId, studentId);
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * Get one homework
     * Authentication required: professor of the course or the student owner of the homework
     * @param name: name of the course (path variable)
     * @param id1: assignment id (path variable)
     * @param id2: homework id (path variable)
     *
     * @return requested homeworkDTO
     */
    @GetMapping("/{name}/assignments/{id1}/homeworks/{id2}")
    HomeworkDTO getHomework(@PathVariable String name, @PathVariable Integer id1, @PathVariable Long id2) {
        try {
            HomeworkDTO h = homeworkService.getHomework(id2);
            String professorId = assignmentService.getAssignmentProfessor(id1);
            String studentId = homeworkService.getHomeworkStudentId(id2);
            return ModelHelper.enrich(h, name, id1, professorId, studentId);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * Review and/or assign the final mark, the usage depends on what object is passed, DTO or image
     * Authentication required: professor of the course
     * @param name: course name (path variable)
     * @param id1: assignment id (path variable)
     * @param id2: homework id (path variable)
     * @param homework: Homework modified by the teacher for a review or for assigning a final mark
     * @return Added homeworkDTO
     */
    @PostMapping("/{name}/assignments/{id1}/homeworks/{id2}")
    HomeworkDTO reviewHomework(@PathVariable String name, @PathVariable Integer id1, @PathVariable Long id2,
                               @Valid @RequestPart(required = false) HomeworkDTO homework,
                               @Valid @RequestPart(required = false) MultipartFile homeworkVersion) {
        try {
            if((homework == null) && (homeworkVersion==null))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing body parts");
            HomeworkDTO h = null;
            if(homeworkVersion != null) {
                h = homeworkService.uploadHomeworkReview(id1, id2, homeworkVersion);
            }
            if(homework != null){
                h = homeworkService.markHomework(homework);
            }
            String professorId = assignmentService.getAssignmentProfessor(id1);
            String studentId = homeworkService.getHomeworkStudentId(h.getId());
            return ModelHelper.enrich(h, name, id1, professorId, studentId);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * Upload a new version of the given homework
     * Authentication required: student owner of the homework
     * @param name: course name (path variable)
     * @param id: assignment id (path variable)
     * @return Added HomeworkVersionDTO
     */
    @PostMapping("/{name}/assignments/{id}")
    HomeworkVersionDTO uploadHomework(@PathVariable String name, @PathVariable Integer id,
                                      @RequestPart(value = "image", required = true) MultipartFile file) {
        try {
            HomeworkDTO h = homeworkService.uploadHomework(id, file);
            return getHomeworkLatestVersion(name, id, h.getId());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * Get all versions of a given homework
     * Authentication required: professor of the course or student owner of the homework
     * @param name: course name (path variable)
     * @param assignmentId: assignment id (path variable)
     * @param hwId: homework id (path variable)
     * @return List of HomeworkVersionDTOs
     */
    @GetMapping("/{name}/assignments/{assignmentId}/homeworks/{hwId}/versions")
    List<HomeworkVersionDTO> getHomeworkVersions(@PathVariable String name, @PathVariable Integer assignmentId, @PathVariable Long hwId) {
        try {
            int versionsSize = homeworkService.getAllImages(hwId).size();
            List<HomeworkVersionDTO> enriched = new ArrayList<>();
            for (int i = 0; i < versionsSize; i++) {
                HomeworkVersionDTO hv = new HomeworkVersionDTO();
                hv.setId(i);
                hv.setDeliveryDate(homeworkService.getDeliveryDate(hwId, i));
                enriched.add(ModelHelper.enrich(hv, name, assignmentId, hwId, i));
            }
            return enriched;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }


    /**
     * Get image of an homework version
     * Authentication required: professor of the course or student owner of the homework
     * @param name: course name (path variable)
     * @param assignmentId: assignment id (path variable)
     * @param hwId: homework id (path variable)
     * @param versionId: homework version counter (path variable)
     * @return request homework version ImageDTO
     */
    @GetMapping("/{name}/assignments/{assignmentId}/homeworks/{hwId}/versions/{versionId}/image")
    ImageDTO getHomeworkVersionImage(@PathVariable String name,
                                     @PathVariable Integer assignmentId,
                                     @PathVariable Long hwId,
                                     @PathVariable Integer versionId) {
        try {
            ImageDTO img = homeworkService.getImage(hwId, versionId);

            return ModelHelper.enrich(img, name, assignmentId, hwId, versionId);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }


    }

    /**
     * Get one version of a given homework
     * Authentication required: professor of the course or student owner of the homework
     * @param name: course name (path variable)
     * @param assignmentId: assignment id (path variable)
     * @param hwId: homework id (path variable)
     * @param versionId: homework version counter (path variable)
     * @return Requested HomeworkVersionDTO
     */
    @GetMapping("/{name}/assignments/{assignmentId}/homeworks/{hwId}/versions/{versionId}")
    HomeworkVersionDTO getHomeworkVersion(@PathVariable String name,
                                          @PathVariable Integer assignmentId,
                                          @PathVariable Long hwId,
                                          @PathVariable Integer versionId) {
        try {
            HomeworkVersionDTO hv = new HomeworkVersionDTO();
            hv.setId(versionId);
            hv.setDeliveryDate(homeworkService.getDeliveryDate(hwId, versionId));

            return ModelHelper.enrich(hv, name, assignmentId, hwId, versionId);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * Get delivery date of an homework version
     * Authentication required: professor of the course or student owner of the homework
     * @param name: course name (path variable)
     * @param assignmentId: assignment id (path variable)
     * @param hwId: homework id (path variable)
     * @param versionId: homework version counter (path variable)
     * @return request homework version ImageDTO
     */
    @GetMapping("/{name}/assignments/{assignmentId}/homeworks/{hwId}/versions/{versionId}/date")
    Timestamp getHomeworkVersionDeliveryDate(@PathVariable String name,
                                             @PathVariable Integer assignmentId,
                                             @PathVariable Long hwId,
                                             @PathVariable Integer versionId) {
        try {
            return homeworkService.getDeliveryDate(hwId, versionId);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * Get latest version of a given homework
     * Authentication required: professor of the course or student owner of the homework
     * @param name: course name (path variable)
     * @param assignmentId: assignment id (path variable)
     * @param hwId: homework id (path variable)
     * @return Requested HomeworkVersionDTO
     */
    @GetMapping("/{name}/assignments/{assignmentId}/homeworks/{hwId}/versions/latest")
    HomeworkVersionDTO getHomeworkLatestVersion(@PathVariable String name,
                                                @PathVariable Integer assignmentId,
                                                @PathVariable Long hwId) {
        try {
            int version = homeworkService.getAllImages(hwId).size() - 1;
            HomeworkVersionDTO hv = new HomeworkVersionDTO();
            hv.setId(version);
            hv.setDeliveryDate(new Timestamp(System.currentTimeMillis()));
            return ModelHelper.enrich(hv, name, assignmentId, hwId, version);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
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
            int i = 0;
            String errorMessage = "";
            while (i < size_codes) {
                try {
                    errorMessage = msg.getMessage(error.getCodes()[i], error.getArguments(), LocaleContextHolder.getLocale());

                    break;
                } catch (NoSuchMessageException e) {
                    i++;
                }

            }
            errors.put(fieldName, errorMessage);
        });
        return errors;
    }


}
