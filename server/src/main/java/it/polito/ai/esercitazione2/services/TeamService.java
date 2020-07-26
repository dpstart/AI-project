package it.polito.ai.esercitazione2.services;

import it.polito.ai.esercitazione2.dtos.*;
import it.polito.ai.esercitazione2.entities.Image;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.multipart.MultipartFile;

import java.io.Reader;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface TeamService {

    // Courses
    @PreAuthorize("hasRole('PROFESSOR')")
    boolean addCourse(CourseDTO c);
    Optional<CourseDTO> getCourse(String name);
    List<CourseDTO> getAllCourses();

    // Professors

    boolean addProfessor(ProfessorDTO p, MultipartFile file);

    boolean addProfessor(ProfessorDTO p);
    Optional<ProfessorDTO> getProfessor(String professorId);
    List<ProfessorDTO> getAllProfessors();


    boolean addStudent(StudentDTO s,boolean notify);

    boolean addStudent(StudentDTO s,boolean notify, MultipartFile file);
    Optional<StudentDTO> getStudent(String studentId);
    List<StudentDTO> getAllStudents();
    List<StudentDTO> getEnrolledStudents(String courseName);
    @PreAuthorize("hasRole('PROFESSOR') or hasRole('ADMIN')")
    boolean addStudentToCourse(String  studentId, String courseName);
    @PreAuthorize("hasRole('PROFESSOR')")
    void enableCourse(String courseName);
    @PreAuthorize("hasRole('PROFESSOR')")
    void disableCourse(String courseName);

    @PreAuthorize("hasRole('ADMIN')")
    List<Boolean> addAll(List<StudentDTO> students,boolean notify);
    @PreAuthorize("hasRole('PROFESSOR') or hasRole('ADMIN')")
    List<Boolean> enrollAll(List<String> studentIds,String courseName);
    @PreAuthorize("hasRole('ADMIN')")
    List<Boolean> addAndEnroll(Reader r, String courseName);
    @PreAuthorize("hasRole('PROFESSOR') or hasRole('ADMIN')")
    List<Boolean> enrollCSV(Reader r, String courseName);

    // Students
    @PreAuthorize("hasRole('STUDENT')")
    List<CourseDTO> getCourses(String studentId);
    List<CourseDTO> getCoursesByProf(String profID);
    @PreAuthorize("hasRole('STUDENT')")
    List<TeamDTO> getTeamsforStudent(String studentId);
    List<StudentDTO> getMembers(String courseName, Long TeamId);
    @PreAuthorize("hasRole('STUDENT')")
    TeamDTO proposeTeam(String courseId,String name, List<String> memberIds);
    List<TeamDTO> getTeamForCourse(String  courseName);
    TeamDTO getOneTeamForCourse(String courseName,Long TeamID);
    @PreAuthorize("hasRole('PROFESSOR')")
    TeamDTO setSettings(String courseName, Long TeamID, SettingsDTO settings);
    List<StudentDTO> getStudentsInTeams(String courseName);
    List<StudentDTO> getAvailableStudents(String courseName);
    boolean activeTeam(Long ID);
    boolean evictTeam(Long ID);
    List<Boolean> evictAll(Set<Long> teams);

    //Images
    Image getProfileImage();

    void activeAccount(String ID);

    void deleteAll(Set<String> students);


}
