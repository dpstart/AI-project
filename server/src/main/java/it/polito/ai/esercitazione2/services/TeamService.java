package it.polito.ai.esercitazione2.services;

import com.opencsv.exceptions.CsvValidationException;
import it.polito.ai.esercitazione2.config.JwtRequest;
import it.polito.ai.esercitazione2.config.JwtResponse;
import it.polito.ai.esercitazione2.dtos.*;
import it.polito.ai.esercitazione2.entities.Image;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.Reader;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * The functions in this service are divided in:
 *             * Login;
 *             * Registration;
 *             * Students:  getters,
 *             * Professors: getters;
 *             * Students Enrollment In The Course;
 *             * Teams: operation;
 *             * Teams: getters;
 *             * Courses: operation;
 *             * Courses: getters;
 *
 *
 */



public interface TeamService {


    /**********************************************************************
     *
     *******************************LOGIN***********************************
     *
     ***********************************************************************/

    // login the user by HTTP post to \authenticate
     JwtResponse loginUser(JwtRequest authenticationRequest);


     void activateAccount(String ID);
     void deleteAll(Set<String> students);

    /******************************************************************************
     *
     *******************************REGISTRATION***********************************
     *
     ******************************************************************************/

    // register a new user with PROFESSOR's role with profile image
    ProfessorDTO  addProfessor(ProfessorDTO p, MultipartFile file);
    // register a new user with PROFESSOR's role without profile image
    ProfessorDTO  addProfessor(ProfessorDTO p);
    // register a new user with STUDENT's role without profile image
    StudentDTO addStudent(StudentDTO s);
    // register a new user with STUDENT's role with profile image
    StudentDTO addStudent(StudentDTO s, MultipartFile file);

    /**********************************************************************
     *
     *****************************PROFESSORS: getters ********************************
     *
     ***********************************************************************/

    // Get the information of a professor
    Optional<ProfessorDTO> getProfessor(String professorId);
    // Get the information of all the  professors enrolled in the system
    List<ProfessorDTO> getAllProfessors();
    ImageDTO getProfessorImage();



    /**********************************************************************
     *
     *******************************STUDENTS: getters ********************************
     *
     ***********************************************************************/

    // get the information of a student
    Optional<StudentDTO> getStudent(String studentId);
    // get the information of all the student enrolled in the system
    List<StudentDTO> getAllStudents();
    ImageDTO getStudentImage();



    /******************************************************************************************
     *
     ******************************* COURSES: operation ****************************************
     *
     *****************************************************************************************/
    @PreAuthorize("hasRole('PROFESSOR')")
    boolean addCourse(CourseDTO c);
    @PreAuthorize("hasRole('PROFESSOR')")
    void removeCourse(String courseName);
    @PreAuthorize("hasRole('PROFESSOR')")
    CourseDTO updateCourse(CourseDTO c);
    @PreAuthorize("hasRole('PROFESSOR')")
    void shareOwnership(String courseName,String profId);
    @PreAuthorize("hasRole('PROFESSOR')")
    List<ProfessorDTO> getProfessorNotInCourse(String courseName);
    @PreAuthorize("hasRole('PROFESSOR')")
    void enableCourse(String courseName);
    @PreAuthorize("hasRole('PROFESSOR')")
    void disableCourse(String courseName);

    /******************************************************************************************
     *
     ******************************* COURSES: getters ****************************************
     *
     *****************************************************************************************/


    // get one course if present
    Optional<CourseDTO> getCourse(String name);
    // get all the courses available
    List<CourseDTO> getAllCourses();
    //  get the courses a student is enrolled to
    @PreAuthorize("hasRole('STUDENT')")
    List<CourseDTO> getCourses(String studentId);
    // get all the courses a professor owns
    List<CourseDTO> getCoursesByProf(String profID);


    /******************************************************************************************
     *
     ******************************* STUDENTS ENROLLMENT IN THE COURSE ************************
     *
     *****************************************************************************************/


     @PreAuthorize("hasRole('PROFESSOR')")
     boolean addStudentToCourse(String  studentId, String courseName);

     @PreAuthorize("hasRole('PROFESSOR')")
     List<Boolean> enrollAll(List<String> studentIds,String courseName);

     @PreAuthorize("hasRole('PROFESSOR')")
     List<Boolean> enrollCSV(Reader r, String courseName) throws IOException, CsvValidationException;

     @PreAuthorize("hasRole('PROFESSOR')")
     List<Boolean> unsubscribe(List<String> studentIds,String courseName);

     List<StudentDTO> getEnrolledStudents(String courseName);

    /**********************************************************************
     *
     *******************************TEAMS: operation ***********************************
     *
     ***********************************************************************/

    //propose a team to a list of students enrolled in a course
    @PreAuthorize("hasRole('STUDENT')")
    TeamDTO proposeTeam(String courseId,String name, List<String> memberIds,Long duration);

    // active one team (after all the invitation have been accepted)
    boolean activateTeam(Long ID);
    // evict one team
    boolean evictTeam(Long ID);
    // evict a set of teams
    List<Boolean> evictAll(Set<Long> teams);

    @PreAuthorize("hasRole('PROFESSOR')")
    TeamDTO setSettings(String courseName, Long TeamID, SettingsDTO settings);


    /**********************************************************************************
     *
     *******************************TEAMS: getters  ***********************************
     *
     **********************************************************************************/

    // get all the teams for a course for which the principal is the professor
    @PreAuthorize("hasRole('PROFESSOR')")
    List<TeamDTO> getTeamForCourse(String courseName);

    // get one team for a course for which the principal is the professor or an enrolled student
    @PreAuthorize("hasRole('PROFESSOR') or hasRole('STUDENT')")
    TeamDTO getOneTeamForCourse(String courseName,Long TeamID);

    // get the information about adhesion of  members to a team; only members of the team can call it
    Map<String,String> getAdhesionInfo(String course,Long teamID);

    @PreAuthorize("hasRole('PROFESSOR') or hasRole('STUDENT')")
    // get all the students members of a team; only students enrolled in the course  can call it
    List<StudentDTO> getMembers(String courseName, Long TeamId);

    // get the students already in a team for a course
    List<StudentDTO> getStudentsInTeams(String courseName);
    // get the available students to form a team for a course
    List<StudentDTO> getAvailableStudents(String courseName);


    // get the list of teams to which a student in enrolled to
    @PreAuthorize("hasRole('STUDENT')")
    List<TeamDTO> getTeamsforStudent(String studentId);

    // get the list of teams proposals for a student in a course
    @PreAuthorize("hasRole('STUDENT')")
    List<TeamDTO> getTeamForStudentAndCourse(String studentId, String courseId);




}
