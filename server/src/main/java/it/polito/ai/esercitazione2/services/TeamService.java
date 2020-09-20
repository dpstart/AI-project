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

    /******************************************************************************************
     *
     ******************************* GENERAL COURSE MANAGEMENT ********************************
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
    Optional<CourseDTO> getCourse(String name);
    List<CourseDTO> getAllCourses();
    @PreAuthorize("hasRole('PROFESSOR')")
    void enableCourse(String courseName);
    @PreAuthorize("hasRole('PROFESSOR')")
    void disableCourse(String courseName);

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
     *******************************TEAMS***********************************
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


    // get all the teams for a course for which the principal is the professor
    @PreAuthorize("hasRole('PROFESSOR')")
    List<TeamDTO> getTeamForCourse(String courseName);

    // get one team for a course for which the principal is the professor or an enrolled student
    @PreAuthorize("hasRole('PROFESSOR') or hasRole('STUDENT')")
    TeamDTO getOneTeamForCourse(String courseName,Long TeamID);

    // get the information about adhesion of  members to a team; only members of the team can call it
    Map<String,String> getAdhesionInfo(String course,Long teamID);









    /**********************************************************************
     *
     *****************************PROFESSORS********************************
     *
     ***********************************************************************/
    ProfessorDTO  addProfessor(ProfessorDTO p, MultipartFile file);
    ProfessorDTO  addProfessor(ProfessorDTO p);
    Optional<ProfessorDTO> getProfessor(String professorId);
    List<ProfessorDTO> getAllProfessors();



    /**********************************************************************
     *
     *******************************STUDENTS********************************
     *
     ***********************************************************************/
    StudentDTO addStudent(StudentDTO s,boolean notify);
    StudentDTO addStudent(StudentDTO s,boolean notify, MultipartFile file);
    Optional<StudentDTO> getStudent(String studentId);
    List<StudentDTO> getAllStudents();

    @PreAuthorize("hasRole('STUDENT')")
    List<CourseDTO> getCourses(String studentId);
    List<CourseDTO> getCoursesByProf(String profID);



    /**********************************************************************
     *
     *******************************TEAMS***********************************
     *
     ***********************************************************************/

    @PreAuthorize("hasRole('STUDENT')")
    List<TeamDTO> getTeamsforStudent(String studentId);
    @PreAuthorize("hasRole('STUDENT')")
    List<TeamDTO> getTeamsforStudentAndCourse(String studentId, String courseId);
    String getTeamCourse(Long teamId);




    @PreAuthorize("hasRole('PROFESSOR')")
    TeamDTO setSettings(String courseName, Long TeamID, SettingsDTO settings);









    // get all the students members of a team; only students enrolled in the course or the professors for the course can call it
    List<StudentDTO> getMembers(String courseName, Long TeamId);

    // get the students already in a team for a course
    List<StudentDTO> getStudentsInTeams(String courseName);
    // get the available students to form a team for a course
    List<StudentDTO> getAvailableStudents(String courseName);



    /**********************************************************************
     *
     *******************************IMAGES********************************
     *
     ***********************************************************************/
    ImageDTO getProfessorImage();
    ImageDTO getStudentImage();



}
