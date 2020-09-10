package it.polito.ai.esercitazione2.controllers;


import it.polito.ai.esercitazione2.dtos.*;
import it.polito.ai.esercitazione2.entities.Image;
import it.polito.ai.esercitazione2.exceptions.*;
import it.polito.ai.esercitazione2.services.AssignmentService;
import it.polito.ai.esercitazione2.services.HomeworkService;
import it.polito.ai.esercitazione2.services.NotificationService;
import it.polito.ai.esercitazione2.services.TeamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.MessageSource;
import org.springframework.context.NoSuchMessageException;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.hateoas.RepresentationModel;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContext;
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
    NotificationService notificationService;

    @Autowired
    @Qualifier("messageSource")
    MessageSource msg;

    /**
     * Gestione generale studenti
     */

    /**
     * Get list of all students
     * Authentication required: none
     *
     * @return List of all StudentDTOs
     */
    @GetMapping({"", "/"})
    public List<StudentDTO> all() {
        return teamservice.getAllStudents().stream()
                .map(ModelHelper::enrich).collect(Collectors.toList());
    }

    /**
     * Get authenticated student
     * Authentication required: student
     *
     * @return Requested StudentDTO
     */
    @GetMapping("/self")
    public Map<String, RepresentationModel> getSelf() {
        String id = SecurityContextHolder.getContext().getAuthentication().getName();
        StudentDTO c = teamservice.getStudent(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, id));
        Map<String, RepresentationModel> retval = new HashMap<>();
        retval.put("self", ModelHelper.enrich(c));
        retval.put("image", teamservice.getStudentImage());
        return retval;
    }

    /**
     * Get one student
     * Authentication required: none
     * @param id: student id (path variable)
     *
     * @return Requested StudentDTO
     */
    @GetMapping("/{id}")
    public StudentDTO getOne(@PathVariable String id) {
        StudentDTO c = teamservice.getStudent(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, id));

        return ModelHelper.enrich(c);
    }

    /**
     * Register a new student
     * Authentication required: none
     * @param dto: student data
     * @param file:  optional, student profile image
     *
     * @return registered StudentDTO
     */
    @PostMapping({"", "/"})
    public StudentDTO addStudent(@Valid @RequestPart("student") StudentDTO dto,
                                 @RequestPart(value = "image", required = false) MultipartFile file) {

        try {
            if (file == null || file.isEmpty()) {
                if (!teamservice.addStudent(dto, true))
                    throw new ResponseStatusException(HttpStatus.CONFLICT, dto.getId());
            } else {
                if (!teamservice.addStudent(dto, true, file))
                    throw new ResponseStatusException(HttpStatus.CONFLICT, dto.getId());
            }
        } catch (IncoherenceException | AuthenticationServiceException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }

        return ModelHelper.enrich(dto);
    }

    /**
     * Register many students
     * Authentication required: admin
     * @param students: students data
     *
     * @return List of registered StudentDTOs
     */
    @PostMapping({"/many"})
    public List<StudentDTO> addStudents(@RequestBody @Valid ValidStudentDTOList students) {
        List<Boolean> res;
        List<StudentDTO> original = students.getList();
        List<StudentDTO> finalRes = new ArrayList<>();
        try {
            res = teamservice.addAll(original, true);
        } catch (IncoherenceException | AuthenticationServiceException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }


        for (int i = 0; i < res.size(); i++) {
            if (res.get(i))
                finalRes.add(ModelHelper.enrich(original.get(i)));
        }
        return finalRes;
    }

    /**
     * Get authenticated student's image
     * Authentication required: student
     *
     * @return Requested ImageDTO
     */
    @GetMapping("/image")
    public ImageDTO getProfileImage() {
        return teamservice.getStudentImage();
    }


    /**
     * Corsi & teams
     */

    /**
     * Get authenticated student's courses
     * Authentication required: student
     *
     * @return List of student's CourseDTOs
     */
    @GetMapping("/courses")
    public List<CourseDTO> getCourses() {
        try {
            return teamservice.getCourses(SecurityContextHolder.getContext().getAuthentication().getName()).stream()
                    .map(ModelHelper::enrich).collect(Collectors.toList());
        } catch (StudentNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    /**
     * Get authenticated student's teams for all courses
     * Authentication required: student
     *
     * @return Requested List of TeamDTOs
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

    /**
     * Get authenticated student's team for specified course
     * Authentication required: student
     * @param name: course name (path variable)
     *
     * @return Requested TeamDTO
     */
    @GetMapping("/courses/{name}/team")
    public TeamDTO getTeamForCourse(@PathVariable String name) {
        try {
            List<TeamDTO> teams = teamservice.getTeamsforStudentAndCourse(SecurityContextHolder.getContext().getAuthentication().getName(), name)
                    .stream()
                    .filter(t -> t.getStatus() == 1)
                    .map(t -> ModelHelper.enrich(t, name))
                    .collect(Collectors.toList());
            if (teams.size() > 1)
                throw new ResponseStatusException(HttpStatus.CONFLICT, "More than one team active for this course");
            if (teams.size() == 0)
                throw new ResponseStatusException(HttpStatus.EXPECTATION_FAILED, "No team found");
            return teams.get(0);

        } catch (StudentNotFoundException | CourseNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    /**
     * Get authenticated student's team proposals for specified course
     * Authentication required: student
     * @param name: course name (path variable)
     *
     * @return Requested List of TeamDTOs
     */
    @GetMapping("/courses/{name}/teamsProposals")
    public List<TeamDTO> getTeamsProposalsForCourse(@PathVariable String name) {
        try {
            return teamservice.getTeamsforStudentAndCourse(SecurityContextHolder.getContext().getAuthentication().getName(), name)
                    .stream()
                    .peek(x -> {
                        if (x.getStatus() == 1)
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


    /**
     * ASSIGNMENTS & HOMEWORKS
     */

    /**
     * Get authenticated student's assignments for all of his courses
     * Authentication required: student
     *
     * @return Requested List of AssignmentDTOs
     */
    @GetMapping("/assignments")
    public List<AssignmentDTO> getAssignments() {
        try {
            String id = SecurityContextHolder.getContext().getAuthentication().getName();
            return assignmentService.getByStudent(id)
                    .stream()
                    .map(a -> {
                        String courseId = assignmentService.getAssignmentCourse(a.getId());
                        String professorId = assignmentService.getAssignmentProfessor(a.getId());
                        return ModelHelper.enrich(a, courseId, professorId);
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * Get one assignment, equal to courseController.getAssignment
     * Authentication required: professor of the course or student enrolled in it
     * @param id: student id (path variable) -- unused
     * @param aId: assignment id (path variable)
     *
     * @return Requested AssignmentDTO
     */
    @GetMapping("/{id}/assignments/{aId}/")
    public AssignmentDTO getAssignment(@PathVariable String id, @PathVariable Integer aId) {
        try {
            String course = assignmentService.getAssignmentCourse(aId);
            return courseController.getAssignment(course, aId);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * Get student's homeworks for all of his courses
     * Authentication required: same student or admin
     *
     * @return Requested List of HomeworkDTOs
     */
    @GetMapping("/{id}/homeworks")
    public List<HomeworkDTO> getHomeworks(@PathVariable String id) {
        try {
            return assignmentService.getByStudent(id)
                    .stream()
                    .flatMap(a -> assignmentService.getAssignmentHomeworks(a.getId()).stream())
                    .map(h -> {
                        String courseId = homeworkService.getHomeworkCourse(h.getId());
                        Integer assignmentId = homeworkService.getAssignmentId(h.getId());
                        String professorId = assignmentService.getAssignmentProfessor(assignmentId);
                        return ModelHelper.enrich(h, courseId, assignmentId, professorId, id);
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * Get one homework, equal to courseController.getHomework
     * Authentication required: professor of the course or student owner of the homework
     * @param id: student id (path variable) -- unused
     * @param hId: homework id (path variable)
     *
     * @return Requested HomeworkDTO
     */
    @GetMapping("/{id}/homeworks/{hId}/")
    public HomeworkDTO getHomework(@PathVariable String id, @PathVariable Long hId) {
        try {
            String course = homeworkService.getHomeworkCourse(hId);
            Integer aId = homeworkService.getAssignmentId(hId);
            return courseController.getHomework(course, aId, hId);
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
