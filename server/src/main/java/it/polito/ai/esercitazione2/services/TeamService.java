package it.polito.ai.esercitazione2.services;

import com.opencsv.exceptions.CsvValidationException;
import it.polito.ai.esercitazione2.config.JwtRequest;
import it.polito.ai.esercitazione2.config.JwtResponse;
import it.polito.ai.esercitazione2.dtos.*;
import it.polito.ai.esercitazione2.entities.Image;
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

    JwtResponse loginUser(JwtRequest authenticationRequest);

    /**********************************************************************
     *
     *******************************COURSE********************************
     *
     ***********************************************************************/
    @PreAuthorize("hasRole('PROFESSOR')")
    boolean addCourse(CourseDTO c);
    @PreAuthorize("hasRole('PROFESSOR')")
    void removeCourse(String courseName);
    @PreAuthorize("hasRole('PROFESSOR')")
    CourseDTO updateCourse(CourseDTO c);
    Optional<CourseDTO> getCourse(String name);
    List<CourseDTO> getAllCourses();
    void shareOwnership(String courseName,String profId);


    /**********************************************************************
     *
     *****************************PROFESSORS********************************
     *
     ***********************************************************************/
    boolean addProfessor(ProfessorDTO p, MultipartFile file);
    boolean addProfessor(ProfessorDTO p);
    Optional<ProfessorDTO> getProfessor(String professorId);
    List<ProfessorDTO> getAllProfessors();

    @PreAuthorize("hasRole('PROFESSOR') or hasRole('ADMIN')")
    boolean addStudentToCourse(String  studentId, String courseName);
    @PreAuthorize("hasRole('PROFESSOR') or hasRole('ADMIN')")
    public boolean removeStudentFromCourse(String studentId, String courseName);

    @PreAuthorize("hasRole('PROFESSOR')")
    void enableCourse(String courseName);
    @PreAuthorize("hasRole('PROFESSOR')")
    void disableCourse(String courseName);

    @PreAuthorize("hasRole('ADMIN')")
    List<Boolean> addAll(List<StudentDTO> students,boolean notify);
    @PreAuthorize("hasRole('PROFESSOR') or hasRole('ADMIN')")
    List<Boolean> enrollAll(List<String> studentIds,String courseName);
    @PreAuthorize("hasRole('PROFESSOR') or hasRole('ADMIN')")
    List<Boolean> unsubscribeAll(List<String> studentIds,String courseName);
    @PreAuthorize("hasRole('ADMIN')")
    List<Boolean> addAndEnroll(Reader r, String courseName);
    @PreAuthorize("hasRole('PROFESSOR') or hasRole('ADMIN')")
    List<Boolean> enrollCSV(Reader r, String courseName) throws IOException, CsvValidationException;

    /**********************************************************************
     *
     *******************************STUDENTS********************************
     *
     ***********************************************************************/
    boolean addStudent(StudentDTO s,boolean notify);
    boolean addStudent(StudentDTO s,boolean notify, MultipartFile file);
    Optional<StudentDTO> getStudent(String studentId);
    List<StudentDTO> getAllStudents();
    List<StudentDTO> getEnrolledStudents(String courseName);
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

    boolean activateTeam(Long ID);
    boolean evictTeam(Long ID);
    List<Boolean> evictAll(Set<Long> teams);


    //propose a team to a list of students enrolled to a course
    @PreAuthorize("hasRole('STUDENT')")
    TeamDTO proposeTeam(String courseId,String name, List<String> memberIds,Long duration);
    // get all the teams for a course for which the principal is the professor or an enrolled student
    List<TeamDTO> getTeamForCourse(String courseName);
    // get one team for a course for which the principal is the professor or an enrolled student
    TeamDTO getOneTeamForCourse(String courseName,Long TeamID);
    // get the information about adhesion of  memebrs to a team; only members of the team can call it
    Map<String,String> getAdhesionInfo(Long teamID);
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
    void activateAccount(String ID);
    void deleteAll(Set<String> students);


}
