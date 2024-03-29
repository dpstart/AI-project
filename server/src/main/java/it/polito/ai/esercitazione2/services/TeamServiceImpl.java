package it.polito.ai.esercitazione2.services;

import com.opencsv.CSVReader;
import com.opencsv.bean.CsvToBean;
import com.opencsv.bean.CsvToBeanBuilder;
import com.opencsv.exceptions.CsvValidationException;
import it.polito.ai.esercitazione2.config.JwtRequest;
import it.polito.ai.esercitazione2.config.JwtResponse;
import it.polito.ai.esercitazione2.config.JwtTokenUtil;
import it.polito.ai.esercitazione2.controllers.ModelHelper;
import it.polito.ai.esercitazione2.dtos.*;
import it.polito.ai.esercitazione2.entities.*;
import it.polito.ai.esercitazione2.exceptions.*;
import it.polito.ai.esercitazione2.repositories.*;
import net.minidev.json.JSONObject;
import org.apache.commons.text.RandomStringGenerator;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.AuthorizationServiceException;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.JdbcUserDetailsManager;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import javax.transaction.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.Reader;

import java.sql.Timestamp;
import java.util.*;
import java.util.stream.Collectors;
import java.util.zip.DataFormatException;
import java.util.zip.Deflater;
import java.util.zip.Inflater;

/**
 * The functions in this service are divided in:
 *             * HTTP Requests towards authentication service;
 *             * Login;
 *             * Registration;
 *             * Students:  getters,
 *             * Professors: getters;
 *             * Students Enrollment In The Course;
 *             * Teams: operation;
 *             * Teams: setters;
 *             * Courses: operation;
 *             * Courses: getters;
 *             * Utilities (compressByte, decompressByte, checkExpirated);
 */


@Service
@Transactional
public class TeamServiceImpl implements TeamService {

    @Autowired
    CourseRepository courseRepository;

    @Autowired
    StudentRepository studentRepository;

    @Autowired
    TeamRepository teamRepository;

    @Autowired
    TokenRepository tokenRepository;

    @Autowired
    ProfessorRepository professorRepository;

    @Autowired
    ModelMapper modelMapper;

    @Autowired
    NotificationService notificationService;

    @Autowired
    ImageService imageService;

    @Autowired
    RandomStringGenerator randomStringGenerator;

    @Autowired
    PasswordEncoder enc;

    @Autowired
    JdbcUserDetailsManager userDetailsManager;


    @Autowired
    VMRepository vmRepository;

    @Autowired
    VMModelRepository vmModelRepository;

    @Autowired
    AssignmentRepository assignmentRepository;

    @Autowired
    HomeworkRepository homeworkRepository;

    @Autowired
    AssignmentService assignmentService;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;



    /****************************************************************************************************
     ******************************  HTTP REQUEST TOWARDS AUTHENTICATION SERVICE ************************
     ****************************************************************************************************/

    WebClient w = WebClient.create("http://localhost:8080");

    /**
     * HTTP request towards \register endpoint of the authentication service
     * Registration token is signed with the shared key
     * @param id,pwd,role: to register user information
     *
     * @return true (success) /false (whatever error)
     */
    public boolean registerUser(String id, String pwd, String role) {


        List<String> roles = new ArrayList<>();
        roles.add(role);
        Boolean a = w.post()
                .uri("/register")
                .body(Mono.just(jwtTokenUtil.generateRegisterRequest(id, pwd, roles)), JwtResponse.class)
                .retrieve()
                .bodyToMono(Boolean.class)
                .block();


        if (a == null)
            return false;
        else
            return a;
    }

    /**
     * HTTP request towards \registerMany endpoint of the authentication service
     * Registration token is signed with the shared key
     * @param input: map (id,pwd) of the users to be registered
     * @param role: role of the users to be registered
     *
     * @return true (success) /false (whatever error)
     */
    public boolean registerUsers(Map<String, String> input, String role) {

        List<JSONObject> list = new ArrayList<>();
        List<String> roles = new ArrayList<>();
        roles.add(role);
        for (String key : input.keySet()) {
            JSONObject personJsonObject = new JSONObject();
            personJsonObject.put("token", jwtTokenUtil.generateRegisterRequest(key, input.get(key), roles));
            list.add(personJsonObject);
        }

        ValidUserList usersList = new ValidUserList();
        usersList.setList(list);


        Boolean result = w.post()
                .uri("/registerMany")
                .body(Mono.just(usersList), ValidUserList.class)

                .retrieve()
                .bodyToMono(Boolean.class)
                .block();
        if (result == null)
            return false;
        else
            return result;


    }


    /**********************************************************************
     *
     *****************************Login*************************************
     *
     ***********************************************************************/

    /**
     * HTTP request towards \authenticate endpoint of the authentication service
     * If the username is different from the user ID (mail,alias,alias-mail), pre-access to the student/professor table to retrieve it
     * @param authenticationRequest: {"username":...,"password":pwd}
     *
     * @return jwtToken
     */
    @Override
    public JwtResponse loginUser(JwtRequest authenticationRequest) {

        String username = authenticationRequest.getUsername();

        username = username.toLowerCase();

        if (username.equals("admin"))
            throw new AuthenticationServiceException("The ADMIN can't access the system from the public web page");


        // if standard standard mail
        if (username.matches("^(s[0-9]{6}@studenti\\.polito\\.it)$")
                || username.matches("^(d[0-9]{6}@polito\\.it)$")) {
            authenticationRequest.setUsername(username.substring(1, 7));
        }

        // if alias
        if (username.matches("^([a-z]+\\.[a-z]+)$")) {
            Student stud = studentRepository.getByAlias(username);
            if (stud != null)
                username = stud.getId();
            else {
                Professor prof = professorRepository.getByAlias(username);
                if (prof != null)
                    username = prof.getId();
                else
                    throw new AuthenticationServiceException("");
            }
            authenticationRequest.setUsername(username);
        }

        // if alias+mail professor
        if (username.matches("^([a-z]+\\.[a-z]+@polito\\.it)$")) {
            username = username.substring(0, username.indexOf("@"));
            Professor prof = professorRepository.getByAlias(username);
            if (prof != null)
                username = prof.getId();
            else
                throw new AuthenticationServiceException("");
            authenticationRequest.setUsername(username);
        }
        // if alias+mail student
        if (username.matches("^([a-z]+\\.[a-z]+@studenti\\.polito\\.it)$")) {
            username = username.substring(0, username.indexOf("@"));
            Student stud = studentRepository.getByAlias(username);
            if (stud != null)
                username = stud.getId();
            else
                throw new AuthenticationServiceException("");
            authenticationRequest.setUsername(username);
        }


        // HTTP POST towards /authenticate
        String a = w.post()
                .uri("/authenticate")
                .body(Mono.just(authenticationRequest), JwtRequest.class)
                .exchange().flatMap(x -> {
                    if (x.statusCode().is4xxClientError() || x.statusCode().is5xxServerError()) {
                        Mono<String> msg = x.bodyToMono(String.class);

                        return msg.flatMap(y -> {
                            throw new AuthenticationServiceException(y);
                        });

                    } else if (x.statusCode().isError()) {

                        Mono<String> msg = x.bodyToMono(String.class);

                        return msg.flatMap(y -> {
                            throw new RuntimeException(y);
                        });
                    } else {

                        return x.bodyToMono(String.class);

                    }

                }).block();


        return new JwtResponse(a);

    }



    /******************************************************************************
     *
     *******************************REGISTRATION***********************************
     *
     ******************************************************************************/

    // add professor with profile  image
    @Override
    public ProfessorDTO addProfessor(ProfessorDTO p, MultipartFile file) {

        //check already existing professor
        if (professorRepository.existsById(p.getId()))
            return null;


        // image saving
        Image img = null;
        try {
            img = imageService.save(new Image(file.getContentType(), compressBytes(file.getBytes())));
        } catch (IOException e) {
        }

        Professor prof = modelMapper.map(p, Professor.class);


        //search for available alias in progressive way
        String alias = prof.getFirstName().toLowerCase() + "." + prof.getName().toLowerCase();
        if (professorRepository.getByAlias(alias) != null) {
            int i = 3;
            for (alias += "2"; professorRepository.getByAlias(alias) != null; i++) {
                alias = alias.substring(0, alias.length() - Integer.toString(i - 1).length());
                alias += Integer.toString(i);
            }
        }

        //alias ad email autogeneration
        prof.setAlias(alias);
        p.setAlias(alias);
        prof.setEmail("d" + p.getId() + "@polito.it");
        p.setEmail("d" + p.getId() + "@polito.it");
        if (img != null)
            prof.setImage_id(img.getId());

        professorRepository.save(prof);


        //HTTP request towards \register of the authentication service
        if (!registerUser(p.getId(), enc.encode(p.getPassword()), "ROLE_PROFESSOR"))
            throw new AuthenticationServiceException("Some errors occurs with the registration of this new user in the system: retry!");

        //notify professor with the link confirm account's activation
        notificationService.notifyProfessor(p);
        return p;
    }

    // add professor without profile image
    @Override
    public ProfessorDTO  addProfessor(ProfessorDTO p) {

        //check  already existing professor
        if (professorRepository.existsById(p.getId()))
            return null;


        Professor prof = modelMapper.map(p, Professor.class);

        //search for available alias in progressive way
        String alias = prof.getFirstName().toLowerCase() + "." + prof.getName().toLowerCase();
        if (professorRepository.getByAlias(alias) != null) {
            int i = 3;
            for (alias += "2"; professorRepository.getByAlias(alias) != null; i++) {
                alias = alias.substring(0, alias.length() - Integer.toString(i - 1).length());
                alias += Integer.toString(i);
            }
        }

        // alias and email generation
        prof.setAlias(alias);
        p.setAlias(alias);
        prof.setEmail("d" + p.getId() + "@polito.it");
        p.setEmail("d" + p.getId() + "@polito.it");

        professorRepository.save(prof);


        //HTTP request towards \register of the authentication service
        if (!registerUser(p.getId(), enc.encode(p.getPassword()), "ROLE_PROFESSOR"))
            throw new AuthenticationServiceException("Some errors occurs with the registration of this new user in the system: retry!");

        //notify professor with the link confirm account's activation
        notificationService.notifyProfessor(p);

        return p;
    }

    // add student with profile image
    @Override
    public StudentDTO addStudent(StudentDTO s, MultipartFile file) {

        // check if student already exists
        if (studentRepository.existsById(s.getId()))
            return null;

        // image saving
        Image img = null;
        try {
            img = new Image(file.getContentType(), compressBytes(file.getBytes()));
            img = imageService.save(img);
        } catch (IOException e) {
        }

        Student stud = modelMapper.map(s, Student.class);

        // search free alias
        String alias = stud.getFirstName().toLowerCase() + "." + stud.getName().toLowerCase();
        if (studentRepository.getByAlias(alias) != null) {
            int i = 3;
            for (alias += "2"; studentRepository.getByAlias(alias) != null; i++) {
                alias = alias.substring(0, alias.length() - Integer.toString(i - 1).length());
                alias += Integer.toString(i);
            }
        }

        // email and alias autogeneration
        stud.setEmail("s" + s.getId() + "@studenti.polito.it");
        stud.setAlias(alias);
        s.setEmail("s" + s.getId() + "@studenti.polito.it");
        s.setAlias(alias);
        if (img != null)
            stud.setImage_id(img.getId());

        studentRepository.save(stud);




        if (!registerUser(stud.getId(), enc.encode(s.getPassword()), "ROLE_STUDENT"))
            throw new AuthenticationServiceException("Some errors occurs with the registration of this new user in the system: retry!");
        notificationService.notifyStudent(s);



        return s;
    }

    // add student without profile image
    @Override
    public StudentDTO addStudent(StudentDTO s) {

        // check if student already exists
        if (studentRepository.existsById(s.getId()))
            return null;

        Student stud = modelMapper.map(s, Student.class);

        // search for free alias
        String alias = stud.getFirstName().toLowerCase() + "." + stud.getName().toLowerCase();
        if (studentRepository.getByAlias(alias) != null) {
            int i = 3;
            for (alias += "2"; studentRepository.getByAlias(alias) != null; i++) {
                alias = alias.substring(0, alias.length() - Integer.toString(i - 1).length());
                alias += Integer.toString(i);
            }
        }

        stud.setAlias(alias);
        stud.setEmail("s" + s.getId() + "@studenti.polito.it");
        s.setAlias(alias);
        s.setEmail("s" + s.getId() + "@studenti.polito.it");

        studentRepository.save(stud);




        if (!registerUser(stud.getId(), enc.encode(s.getPassword()), "ROLE_STUDENT"))
            throw new AuthenticationServiceException("Some errors occurs with the registration of this new user in the system: retry!");
        notificationService.notifyStudent(s);



        return s;
    }

    /**
     * Remove all the not enabled account for which the confirmation token is expired
     * Remove the users from the student/professor table and then from the users one through HTTP post to \removeMany
     * @param users: set of user IDs to delete
     */
    @Override
    public void deleteAll(Set<String> users) {
        studentRepository.deleteAll(users.stream().filter(x -> studentRepository.existsById(x)).map(x -> studentRepository.getOne(x)).collect(Collectors.toList()));
        professorRepository.deleteAll(users.stream().filter(x -> professorRepository.existsById(x)).map(x -> professorRepository.getOne(x)).collect(Collectors.toList()));
        removeAccounts(users);
    }

    /**
     * HTTP request towards \removeMany endpoint of the authentication service
     * Remove users for which the activation token is expired
     * Removal token is signed with the shared key
     * @param users: account to be removed
     *
     * @return
     */
    public void removeAccounts(Set<String> users) {
        List<JSONObject> list = new ArrayList<>();
        for (String key : users) {
            JSONObject personJsonObject = new JSONObject();
            personJsonObject.put("token", jwtTokenUtil.generateIdRequest(key));
            list.add(personJsonObject);
        }

        ValidUserList usersList = new ValidUserList();
        usersList.setList(list);
        w.post()
                .uri("/removeMany")
                .body(Mono.just(usersList), ValidUserList.class)
                .exchange()
                .subscribe();

    }

    /**
     * HTTP request towards \activate endpoint of the authentication service
     * Registration token is signed with the shared key
     * @param id: account to activate
     *
     * @return
     */
    public void activateAccount(String id) {


        if (studentRepository.existsById(id)) {
            studentRepository.getOne(id).setEnabled(true);
        } else if (professorRepository.existsById(id)) {
            professorRepository.getOne(id).setEnabled(true);
        } else
            throw new UsernameNotFoundException("Impossible to activate not existing user");


        w.post()
                .uri("/activate")
                .body(Mono.just(jwtTokenUtil.generateIdRequest(id)), JwtResponse.class)
                .exchange()
                .subscribe();
    }



    /**********************************************************************
     *
     *****************************PROFESSORS: GETTERS ********************************
     *
     ***********************************************************************/

    @Override
    public Optional<ProfessorDTO> getProfessor(String professorId) {
        return professorRepository.findById(professorId).filter(Professor::getEnabled).map(x -> modelMapper.map(x, ProfessorDTO.class));
    }

    @Override
    public List<ProfessorDTO> getAllProfessors() {
        return professorRepository.findAll()
                .stream()
                .filter(Professor::getEnabled)
                .map(s -> modelMapper.map(s, ProfessorDTO.class))
                .collect(Collectors.toList());
    }

    // get the profile image of the current authenticated professor
    @Override
    public ImageDTO getProfessorImage() {
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        Image img;
        if (professorRepository.existsById(principal))
            img = imageService.getImage(professorRepository.getOne(principal).getImage_id());
        else
            throw new UsernameNotFoundException("Can't retrieve profile image for the specified professor");

        if (img == null)
            img = new Image();
        return modelMapper.map(img, ImageDTO.class);
    }

    /***********************************************************************
     *
     *****************************STUDENTS: GETTERS**********************************
     *
     ***********************************************************************/


    @Override
    public Optional<StudentDTO> getStudent(String studentId) {
        return studentRepository.findById(studentId).filter(Student::getEnabled).map(x -> modelMapper.map(x, StudentDTO.class));
    }


    @Override
    public List<StudentDTO> getAllStudents() {
        return studentRepository.findAll()
                .stream()
                .filter(Student::getEnabled)
                .map(s -> modelMapper.map(s, StudentDTO.class))
                .collect(Collectors.toList());
    }





    // get the profile image of a student
    @Override
    public ImageDTO getStudentImage() {
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        Image img;
        if (studentRepository.existsById(principal))
            img = imageService.getImage(studentRepository.getOne(principal).getImage_id());
        else
            throw new UsernameNotFoundException("Can't retrieve profile image for the specified student");

        if (img == null)
            img = new Image();
        return modelMapper.map(img, ImageDTO.class);
    }




    /***********************************************************************
     *
     *****************************COURSES: operation***********************************
     *
     ***********************************************************************/

    @Override
    public boolean addCourse(CourseDTO c) {
        String prof = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!professorRepository.existsById(prof) || !professorRepository.getOne(prof).getEnabled())
            throw new ProfessorNotFoundException("Professor " + prof + " not found!");
        Professor p = professorRepository.findById(prof).get();
        if (courseRepository.existsById(c.getName()) || courseRepository.existsByAcronime(c.getAcronime()))
            return false;

        if (c.getMin() > c.getMax())
            throw new TeamSizeConstraintsException("The maximum number of team members for a course should be greater or equal to the minimum one");
        c.setEnabled(false);
        Course course = modelMapper.map(c, Course.class);
        course.addProfessor(p);
        courseRepository.save(course);
        return true;
    }
    @Override
    public void shareOwnership(String courseName, String profId) {
        String prof = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!courseRepository.existsById(courseName) && !courseRepository.existsByAcronime(courseName))
            throw new CourseNotFoundException("Course " + courseName + " not found");
        Course c = courseRepository.getOne(courseName);
        if (c.getProfessors().stream().noneMatch(x -> x.getId().equals(prof))) {
            throw new AuthorizationServiceException("Autenticated user is not a professor for this course");
        }
        if (!professorRepository.existsById(profId))
            throw new ProfessorNotFoundException("Professor " + profId + " not found");
        Professor p = professorRepository.getOne(profId);
        if (!p.getEnabled())
            throw new ProfessorNotFoundException("Professor " + profId + " not found");

        if (c.getProfessors().stream().anyMatch(x -> x.getId().equals(profId)))
            throw new IncoherenceException("Professor " + profId + " already a professor for this course");

        c.addProfessor(p);
        courseRepository.save(c);

    }
    @Override
    public void removeCourse(String courseName) {
        String prof = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!courseRepository.existsById(courseName) && !courseRepository.existsByAcronime(courseName))
            throw new CourseNotFoundException("Course: " + courseName + " not found!");
        Course c = courseRepository.getOne(courseName);
        if (c.getProfessors().stream().noneMatch(x -> x.getId().equals(prof)))
            throw new CourseAuthorizationException("Professor " + prof + "has not the rights to modify this course");

        if (c.getEnabled())
            throw new CourseEnabledException("Impossible to remove an active course");


        // c.getAssignments().stream().peek(x -> imageService.remove(x.getContentId())).flatMap(x -> x.getHomeworks().stream()).flatMap(x -> x.getVersionIds().stream()).forEach((Long x) -> imageService.remove(x));


        c.getTeams().stream().flatMap(x -> x.getVMs().stream()).forEach(x -> imageService.remove(x.getImageId()));


        courseRepository.delete(c);

    }
    @Override
    public List<ProfessorDTO> getProfessorNotInCourse(String courseName) {

        String prof = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!courseRepository.existsById(courseName) && !courseRepository.existsByAcronime(courseName))
            throw new CourseNotFoundException("Course " + courseName + " not found");
        Course c = courseRepository.getOne(courseName);
        if (c.getProfessors().stream().noneMatch(x -> x.getId().equals(prof))) {
            throw new AuthorizationServiceException("Autenticated user is not a professor for this course");
        }


        return professorRepository.getProfessorNotInCourse(courseName).stream().map(x->modelMapper.map(x,ProfessorDTO.class)).collect(Collectors.toList());
    }
    @Override
    public void enableCourse(String courseName) {
        String prof = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!courseRepository.existsById(courseName) && !courseRepository.existsByAcronime(courseName))
            throw new CourseNotFoundException("Course " + courseName + " not found!");
        Course c = courseRepository.getOne(courseName);
        if (c.getProfessors().stream().noneMatch(x -> x.getId().equals(prof)))
            throw new CourseAuthorizationException("Professor " + prof + "has not the rights to modify this course");
        c.setEnabled(true);
    }
    @Override
    public void disableCourse(String courseName) {
        String prof = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!courseRepository.existsById(courseName) && !courseRepository.existsByAcronime(courseName))
            throw new CourseNotFoundException("Course: " + courseName + " not found!");
        Course c = courseRepository.getOne(courseName);
        if (c.getProfessors().stream().noneMatch(x -> x.getId().equals(prof)))
            throw new CourseAuthorizationException("Professor " + prof + "has not the rights to modify this course");

        //stop all Virtual machines of this course
        c.getTeams().stream().flatMap(x -> x.getVMs().stream()).forEach(
                x -> {
                    x.setStatus(0);
                    vmRepository.save(x);
                }
        );
        c.setEnabled(false);
    }
    @Override
    public CourseDTO updateCourse(CourseDTO c) {
        String prof = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!courseRepository.existsById(c.getName()) && !courseRepository.existsByAcronime(c.getAcronime()))
            throw new CourseNotFoundException("Course: " + c.getName() + " not found!");
        Course co = courseRepository.getOne(c.getName());
        if (co.getProfessors().stream().noneMatch(x -> x.getId().equals(prof)))
            throw new CourseAuthorizationException("Professor " + prof + "has not the rights to modify this course");

        int min = c.getMin();
        int max = c.getMax();

        if (min > max)
            throw new IncoherenceException("Impossible to set a minimum number of members greater than the maximum one");

        if (co.getTeams().stream().map(x -> x.getMembers().size()).anyMatch((Integer x) -> x < min || x > max))
            throw new TeamSizeConstraintsException("Impossible to change group size constraints because it would invalidate already existing teams");

        co.setMin(min);
        co.setMax(max);
        if(c.getEnabled() != co.getEnabled()){
            if(!c.getEnabled()){
                this.disableCourse(c.getName());
            }
            else{
                this.enableCourse(c.getName());
            }
        }

        return modelMapper.map(co, CourseDTO.class);

    }

    /********************************************************************************
     *
     *****************************COURSES: GETTERS ***********************************
     *
     ********************************************************************************/



    @Override
    public Optional<CourseDTO> getCourse(String name) {
        Optional<Course> c = courseRepository.findById(name);
        if (c.isEmpty() && courseRepository.existsByAcronime(name))
            c = Optional.of(courseRepository.getOne(name));
        return c.map(x -> modelMapper.map(x, CourseDTO.class));
    }

    @Override
    public List<CourseDTO> getAllCourses() {
        return courseRepository.findAll()
                .stream()
                .map(c -> modelMapper.map(c, CourseDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public List<CourseDTO> getCourses(String studentId) {
        if (!studentRepository.existsById(studentId) || !studentRepository.getOne(studentId).getEnabled())
            throw new StudentNotFoundException("Student: " + studentId + " not found!");
        Student s = studentRepository.getOne(studentId);
        return s.getCourses()
                .stream()
                .map(x -> modelMapper.map(x, CourseDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public List<CourseDTO> getCoursesByProf(String profID) {
        String message = "Prof " + profID + " not found";
        if (profID == null || profID.isEmpty()) {
            profID = SecurityContextHolder.getContext().getAuthentication().getName();
            message = "Currently authenticated user is not a professor";
        }
        if (!professorRepository.existsById(profID))
            throw new ProfessorNotFoundException(message);

        if (!professorRepository.getOne(profID).getEnabled())
            throw new ProfessorNotFoundException("Not activated account");
        Professor p = professorRepository.getOne(profID);
        return p.getCourses().stream()
                .map(x -> modelMapper.map(x, CourseDTO.class))
                .collect(Collectors.toList());
    }


    /******************************************************************************************
     *
     ******************************* STUDENTS ENROLLMENT IN THE COURSE ************************
     *
     *****************************************************************************************/

    @Override
    public boolean addStudentToCourse(String studentId, String courseName) {
        String prof = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!courseRepository.existsById(courseName) && !courseRepository.existsByAcronime(courseName))
            throw new CourseNotFoundException("Course: " + courseName + " not found!");
        Course c = courseRepository.getOne(courseName);
        if (c.getProfessors().stream().noneMatch(x -> x.getId().equals(prof)) )
            throw new CourseAuthorizationException("User " + prof + " has not the rights to modify this course: he's not a professor for this course");
        if (!studentRepository.existsById(studentId) || !studentRepository.getOne(studentId).getEnabled())
            throw new StudentNotFoundException("Student: " + studentId + " not found!");

        Student s = studentRepository.getOne(studentId);

        if (c.getStudents().contains(s))
            return false;
        // paranoia
        if (s.getCourses().contains(c))
            return false;


        c.addStudent(s);
        for (Assignment a : c.getAssignments().stream().filter(
                a -> //Do la possiblità al nuovo studente di consegnare solo se mancano almeno 10 minuti alla scadenza
                        a.getExpirationDate().after(new Timestamp(System.currentTimeMillis() + 10 * 60 * 1000)))
                .collect(Collectors.toList())
        ) {
            Homework h = new Homework();
            h.setAssignment(a);
            h.setStudent(s);
            h.setLastModified(new Timestamp(System.currentTimeMillis()));
            homeworkRepository.saveAndFlush(h);
            a.addHomework(h);
        }
        return true;
    }

    @Override
    public List<Boolean> enrollAll(List<String> studentIds, String courseName) {
        return studentIds.stream().map(x -> addStudentToCourse(x, courseName)).collect(Collectors.toList());
    }

    @Override
    public List<Boolean> enrollCSV(Reader r, String courseName) throws IOException, CsvValidationException {

        List<String> users_ids = new ArrayList<>();
        try (CSVReader csvReader = new CSVReader(r)) {
            String[] values = null;
            csvReader.readNext(); //skip header
            while ((values = csvReader.readNext()) != null) {
                users_ids.add(values[0]);
            }
        } catch (IOException | CsvValidationException e) {
            throw e;
        }

        List<Boolean> resEnroll = enrollAll(users_ids, courseName);

        return resEnroll;

    }

    boolean removeStudentFromCourse(String studentId, Course c) {
        if (!studentRepository.existsById(studentId) || !studentRepository.getOne(studentId).getEnabled())
            throw new StudentNotFoundException("Student: " + studentId + " not found!");

        if (c.getStudents().stream().noneMatch(x -> x.getId().equals(studentId)))
            throw new StudentNotFoundException("Student: " + studentId + " not enrolled in this course!");


        Student s = studentRepository.getOne(studentId);

        // remove homerwork of the student
        // s.getHomeworks().stream().peek(x -> x.getVersionIds().forEach((Long y) -> imageService.remove(y))).forEach((Homework x) -> homeworkRepository.delete(x));

        // rimuovere relazione ownership con VM, se è l'unico rimuovere proprio la VM
        s.getVMs().stream().filter(x -> x.getOwners().size() == 1).peek(x -> imageService.remove(x.getImageId())).forEach((VM x) -> vmRepository.delete(x));
        // rimuovere dal team: se il team va sotto la soglia minima, rimuoverlo
        Team t = s.getTeams().stream().filter(x -> (x.getCourse().getName().equals(c.getName()) || x.getCourse().getAcronime().equals(c.getName()))).findFirst().orElse(null);

        if (t != null) {
            t.removeStudent(s);
            if (t.getMembers().size() < c.getMin())
                teamRepository.delete(t);
        }
        c.removeStudent(s);
        return true;
    }

    @Override
    public List<Boolean> unsubscribe(List<String> studentIds, String courseName) {
        String prof = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!courseRepository.existsById(courseName) && !courseRepository.existsByAcronime(courseName))
            throw new CourseNotFoundException("Course: " + courseName + " not found!");
        Course c = courseRepository.getOne(courseName);
        if (c.getProfessors().stream().noneMatch(x -> x.getId().equals(prof)))
            throw new CourseAuthorizationException("User " + prof + " has not the rights to modify this course: he's not a professor for this course");
        return studentIds.stream().map(x -> removeStudentFromCourse(x, c)).collect(Collectors.toList());
    }

    @Override
    public List<StudentDTO> getEnrolledStudents(String courseName) {
        if (!courseRepository.existsById(courseName) && !courseRepository.existsByAcronime(courseName))
            throw new CourseNotFoundException("Course: " + courseName + " not found!");
        Course c = courseRepository.getOne(courseName);
        return c.getStudents()
                .stream()
                .map(s -> modelMapper.map(s, StudentDTO.class))
                .collect(Collectors.toList());
    }

    /***********************************************************************************
     *
     *******************************TEAMS: operation ***********************************
     *
     ***********************************************************************************/


    // create a disable team if it respects all the constraint for a course;
    // send the activation/rejection link to the invited students
    @Override
    public TeamDTO proposeTeam(String courseId, String name, List<String> memberIds, Long duration) {
        String proposer = SecurityContextHolder.getContext().getAuthentication().getName();

        // check if the course exists
        if (!courseRepository.existsById(courseId) && !courseRepository.existsByAcronime(courseId))
            throw new CourseNotFoundException("Course: " + courseId + " not found!");
        Course c = courseRepository.getOne(courseId);

        // check if there is at least one invited student
        if (memberIds.size() == 0)
            throw new TeamSizeConstraintsException("It need to specify at least one student for  a team");

        //The proposer should be in the team
        if (!memberIds.contains(proposer))
            memberIds.add(proposer);

        List<Student> enrolled = c.getStudents();

        // check if invited students exist and are enrolled in this course
        List<Student> members = memberIds.stream()
                .map(x -> {
                    if (studentRepository.existsById(x) && studentRepository.getOne(x).getEnabled())
                        return studentRepository.getOne(x);
                    else
                        throw new StudentNotFoundException("Student: " + x + " not found!");
                })
                .map(x -> {
                    if (enrolled.contains(x))
                        return x;
                    throw new NotAllEnrolledException("Student: " + x.getId() + " not enrolled in the course: " + courseId);

                })
                .collect(Collectors.toList());


        List<Team> teams = c.getTeams();

        // check existing teams with the same name
        boolean nameAlreadyPresent = teams.stream().map(Team::getName).anyMatch(x -> x.equals(name));

        if (nameAlreadyPresent)
            throw new TeamNameAlreadyPresentInCourse("A team with this name already exists for this course");

        // check if a student is already part of one of teams of this course
        boolean alreadyInATeam = members.stream()
                .flatMap(x -> x.getTeams().stream().filter(t -> t.getStatus() == 1))
                .anyMatch(teams::contains);
        if (alreadyInATeam)
            throw new AlreadyInACourseTeamException("One or more among specified students is already part of a team inside course " + courseId);

        // check if the list of members contains duplicated students
        Set<String> set = new HashSet<String>(memberIds);
        if (set.size() < memberIds.size())
            throw new DuplicatePartecipantsException("Duplicated team members");

        // check that the members' size respects the course's constraints
        if (memberIds.size() < c.getMin() || memberIds.size() > c.getMax())
            throw new TeamSizeConstraintsException("Size costraints for teams in course " + courseId + " Min: " + c.getMin() + " Max: " + c.getMax());

        // two team proposal with exactly the same invited members can't exist
        if (teams.stream().filter(t->t.getStatus()==0)
                .anyMatch(x ->{ List<String> l = x.getMembers()
                        .stream()
                        .map(s -> s.getId())
                        .collect(Collectors.toList());
                    return l.containsAll(memberIds) && l.size()==memberIds.size();
                } )) {
            throw new DuplicateTeamException("A team proposal with the same members is already existing");
        }


        Team t = new Team();
        t.setName(name);
        t.setCourse(c);

        t.setId_creator(proposer);

        if (members.size()==1)
            t.setStatus(1);
        else
            t.setStatus(0);

        for (Student s : members)
            t.addStudent(s);

        TeamDTO dto = modelMapper.map(teamRepository.save(t), TeamDTO.class);

        // the proposer accepts the team invitation by default, so he should not receive the activation/rejection link
        memberIds.remove(proposer);

        Map<String,String> tokens=notificationService.generateTokens(t.getId(),memberIds,duration);
        notificationService.notifyTeam(t.getName(),tokens);
        return dto;

    }

    // activate the teams for which all the invitations have been accepted
    // evict all the other teams waiting for one of ther members of the currently activated team
    @Override
    public boolean activateTeam(Long ID) {
        Optional<Team> t = teamRepository.findById(ID);
        if (t.isEmpty())
            return false;
        t.get().setStatus(1);
        // evict all the other teams waiting for one of ther members of the currently activated team
        for (Student s : t.get().getMembers()) {
            s.getTeams().stream()
                    .filter(x -> x.getCourse() == t.get().getCourse() && x.getStatus() == 0)
                    .forEach(x -> {
                        evictTeam(x.getId());
                    });
        }
        return true;
    }

    // evict all the teams
    @Override
    public List<Boolean> evictAll(Set<Long> teams) {
        return teams.stream().map(this::evictTeam).collect(Collectors.toList());
    }

    // evict a team by setting his course to Null
    @Override
    public boolean evictTeam(Long ID) {
        Optional<Team> t = teamRepository.findById(ID);
        if (t.isEmpty())
            return false;
        Team team = t.get();
        team.setCourse(null);
        return true;
    }

    // set the VM settings of a team
    @Override
    public TeamDTO setSettings(String courseName, Long teamId, SettingsDTO settings) {
        String prof = SecurityContextHolder.getContext().getAuthentication().getName();

        // does the course exist?
        if (!courseRepository.existsById(courseName) && !courseRepository.existsByAcronime(courseName))
            throw new CourseNotFoundException("Course: " + courseName + " not found!");
        Course c = courseRepository.getOne(courseName);
        // is the principal a professor owning this course?
        if (c.getProfessors().stream().noneMatch(x -> x.getId().equals(prof)))
            throw new CourseAuthorizationException("User " + prof + " has not the rights to modify this course: he's not the professor for this course");
        // does the team exist?
        if (!teamRepository.existsById(teamId))
            throw new TeamNotFoundException("Team: " + teamId + " not found!");

        Team t = teamRepository.getOne(teamId);

        //  check  if the team belongs to the specified course
        if (!t.getCourse().getName().equals(courseName) && !t.getCourse().getAcronime().equals(courseName))
            throw new IncoherenceException("Team " + teamId + " doens't belong to this course");

        // coherence constraint on max active and available
        if (settings.getMax_active() > settings.getMax_available())
            throw new NotExpectedStatusException("It's not possible assign a maximum value for active machines greater than the available one!");

        // It's not possible assign less resources than already allocated

        if (t.getVMs().size() > settings.getMax_available() ||
                t.getVMs().stream().map(VM::getRam).mapToInt(Integer::intValue).sum() > settings.getRam() ||
                t.getVMs().stream().map(VM::getDisk_space).mapToInt(Integer::intValue).sum() > settings.getDisk_space() ||
                t.getVMs().stream().map(VM::getN_cpu).mapToInt(Integer::intValue).sum() > settings.getN_cpu() ||
                t.getVMs().stream().map(VM::getStatus).mapToInt(Integer::intValue).sum() > settings.getMax_active())
            throw new NotExpectedStatusException("It's not possible assign less resources than already allocated!");

        t.setN_cpu(settings.getN_cpu());
        t.setDisk_space(settings.getDisk_space());
        t.setRam(settings.getRam());
        t.setMax_active(settings.getMax_active());
        t.setMax_available(settings.getMax_available());


        return modelMapper.map(teamRepository.save(t), TeamDTO.class);
    }


    /***********************************************************************************
     *
     *******************************TEAMS: getters *************************************
     *
     ***********************************************************************************/

    // Get the list of teams for a course, only if the principal is a professor owning the course
    @Override
    public List<TeamDTO> getTeamForCourse(String courseName) {
        if (!courseRepository.existsById(courseName) && !courseRepository.existsByAcronime(courseName))
            throw new CourseNotFoundException("Course: " + courseName + " not found!");

        String principal = SecurityContextHolder.getContext().getAuthentication().getName();

        Course c = courseRepository.getOne(courseName);

        if (c.getProfessors().stream().noneMatch(x -> x.getId().equals(principal)))
            throw new CourseAuthorizationException("User " + principal + " has not the rights to see the teams for this course");

        return teamRepository.getByCourse(c).stream().map(x -> modelMapper.map(x, TeamDTO.class))
                .collect(Collectors.toList());

    }

    //NOT USED BY THE CLIENT: retrieve a specific team of a course
    @Override
    public TeamDTO getOneTeamForCourse(String courseName, Long teamID) {
        if (!courseRepository.existsById(courseName) && !courseRepository.existsByAcronime(courseName))
            throw new CourseNotFoundException("Course: " + courseName + " not found!");

        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        Course c = courseRepository.getOne(courseName);

        // il principal è un docente o studente del corso? o
        if (c.getProfessors().stream().noneMatch(x -> x.getId().equals(principal)) && c.getStudents().stream().noneMatch(x -> x.getId().equals(principal)))
            throw new CourseAuthorizationException("User " + principal + " has not the rights to see the teams for this course");

        Optional<Team> t = teamRepository.findById(teamID);
        if (t.isEmpty() || (!t.get().getCourse().getName().equals(courseName) && !t.get().getCourse().getAcronime().equals(courseName))) {
            throw new TeamNotFoundException("Team " + teamID + " not found");
        }
        return modelMapper.map(t.get(), TeamDTO.class);

    }

    // return information about the current adhesion ifno for the memebrs of the team, and the confirmation/rejection token for the authenticated user
    @Override
    public Map<String, String> getAdhesionInfo(String courseName, Long teamID) {

        //check if the course exists
        if (!courseRepository.existsById(courseName) && !courseRepository.existsByAcronime(courseName))
            throw new CourseNotFoundException("Course: " + courseName + " not found!");

        // check if the team exists
        if (!teamRepository.existsById(teamID))
            throw new TeamNotFoundException("Team " + teamID + " not found");

        Team t = teamRepository.getOne(teamID);

        // check if the team exists in thic course
        if (!t.getCourse().getName().equals(courseName) && !t.getCourse().getAcronime().equals(courseName)) {
            throw new TeamNotFoundException("Team " + teamID + " not found");
        }

        Map<String, String> m = new HashMap<>();
        List<Student> members = t.getMembers();

        // check if the requesting user is part of the team
        if (!members.stream().map(Student::getId).anyMatch(x -> x.equals(SecurityContextHolder.getContext().getAuthentication().getName())))
            throw new AuthorizationServiceException("Student not belonging to this team");


        // find all tokens associated to a team
        List<Token> tokens = tokenRepository.findAllByTeamId(teamID);
        List<String> user_tokens = tokens.stream().map(x->x.getUserId()).collect(Collectors.toList());

        for (Student s : members) {
            String token="false";


            // if it exists a token for this user it means it not accepted/rejected yet the invitation
            if (user_tokens.contains(s.getId())){
                // if this token is associated to the authenticated user return the token to send in the request
                if (s.getId().equals(SecurityContextHolder.getContext().getAuthentication().getName()))
                    token = tokens.stream().filter(x->x.getUserId().equals(s.getId())).findFirst().get().getId();
            } else
                token="true";

            m.put(s.getId(), token);
        }
        return m;
    }


    // return the list of members for a team; only a student part of the team or a professor owning the course can call it;
    @Override
    public List<StudentDTO> getMembers(String courseName, Long teamID) {
        if (!courseRepository.existsById(courseName) && !courseRepository.existsByAcronime(courseName))
            throw new CourseNotFoundException("Course: " + courseName + " not found!");
        Course c = courseRepository.getOne(courseName);
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        // is the principal a student memebr of the course or a professor owning it?
        if (c.getProfessors().stream().noneMatch(x -> x.getId().equals(principal)) && c.getStudents().stream().noneMatch(x -> x.getId().equals(principal)))
            throw new CourseAuthorizationException("User " + principal + " has not the rights to see the teams for this course");
        Optional<Team> t = teamRepository.findById(teamID);
        if (t.isEmpty() || (!t.get().getCourse().getName().equals(courseName) && !t.get().getCourse().getAcronime().equals(courseName))) {
            throw new TeamNotFoundException("Team " + teamID + " not found");
        }
        Team team = teamRepository.getOne(teamID);
        return team.getMembers()
                .stream()
                .map(x -> modelMapper.map(x, StudentDTO.class))
                .collect(Collectors.toList());
    }

    // return the list of students enrolled in a specific course that are already part of a team
    @Override
    public List<StudentDTO> getStudentsInTeams(String courseName) {
        if (!courseRepository.existsById(courseName) && !courseRepository.existsByAcronime(courseName))
            throw new CourseNotFoundException("Course: " + courseName + " not found!");
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        Course c = courseRepository.getOne(courseName);

        // is the principal a professor or a student memebr of the course?
        if (c.getProfessors().stream().noneMatch(x -> x.getId().equals(principal)) && c.getStudents().stream().noneMatch(x -> x.getId().equals(principal)))
            throw new CourseAuthorizationException("User " + principal + " has not the rights to see the teams for this course");

        //return the students that are enrolled in the course and that are already associated with a team.
        return courseRepository.getStudentsInTeams(courseName)
                .stream()
                .map(x -> modelMapper.map(x, StudentDTO.class))
                .collect(Collectors.toList());
    }

    // return the list of students enrolled in a specific course that are not part of a team yet
    @Override
    public List<StudentDTO> getAvailableStudents(String courseName) {
        if (!courseRepository.existsById(courseName) && !courseRepository.existsByAcronime(courseName))
            throw new CourseNotFoundException("Course: " + courseName + " not found!");
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        Course c = courseRepository.getOne(courseName);

        // is the principal a professor or a student member of the course?
        if (c.getProfessors().stream().noneMatch(x -> x.getId().equals(principal)) && c.getStudents().stream().noneMatch(x -> x.getId().equals(principal)))
            throw new CourseAuthorizationException("User " + principal + " has not the rights to see the teams for this course");

        //return the students that are enrolled in the course but that are not associated with a team yet
        return courseRepository.getStudentsNotInTeams(courseName)
                .stream()
                .filter(Student::getEnabled)
                .map(x -> modelMapper.map(x, StudentDTO.class))
                .collect(Collectors.toList());
    }

    // get all the teams a student is enrolled to
    @Override
    public List<TeamDTO> getTeamsforStudent(String studentId) {
        if (!studentRepository.existsById(studentId) || !studentRepository.getOne(studentId).getEnabled())
            throw new StudentNotFoundException("Student: " + studentId + " not found!");
        Student s = studentRepository.getOne(studentId);
        return s.getTeams()
                .stream()
                .filter(t -> t.getCourse() != null && t.getStatus() == 1)
                .map(x -> {
                    TeamDTO t = modelMapper.map(x, TeamDTO.class);
                    return ModelHelper.enrich(t,x.getCourse().getName());
                } )
                .collect(Collectors.toList());
    }

    //get all the team proposals for a student enrolled in a specified course
    @Override
    public List<TeamDTO> getTeamForStudentAndCourse(String studentId, String courseId) {
        if (!studentRepository.existsById(studentId) || !studentRepository.getOne(studentId).getEnabled()) {
            throw new StudentNotFoundException("Student: " + studentId + " not found!");
        }
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        Course c = courseRepository.getOne(courseId);

        if (c.getProfessors().stream().noneMatch(x -> x.getId().equals(principal)) && studentId != principal)
            throw new CourseAuthorizationException("User " + principal + " has not the rights to see the teams for this course");
        Student s = studentRepository.getOne(studentId);
        return s.getTeams()
                .stream()
                .filter(t -> (t.getCourse().getName().equals(courseId) || t.getCourse().getAcronime().equals(courseId)))
                .map(x -> modelMapper.map(x, TeamDTO.class))
                .collect(Collectors.toList());
    }


    /*****************************************************************************
     *
     ******************************* UTILITIES ***********************************
     *
     *****************************************************************************/


    // compress the image to store it on the DB
    public static byte[] compressBytes(byte[] data) {
        Deflater deflater = new Deflater();
        deflater.setInput(data);
        deflater.finish();
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream(data.length);
        byte[] buffer = new byte[1024];
        while (!deflater.finished()) {
            int count = deflater.deflate(buffer);
            outputStream.write(buffer, 0, count);
        }
        try {
            outputStream.close();
        } catch (IOException ignored) {
        }
        System.out.println("Compressed Image Byte Size - " + outputStream.toByteArray().length);
        return outputStream.toByteArray();
    }

    // uncompress the image bytes before returning it to the angular application
    public static byte[] decompressBytes(byte[] data) {
        Inflater inflater = new Inflater();
        inflater.setInput(data);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream(data.length);
        byte[] buffer = new byte[1024];
        try {
            while (!inflater.finished()) {
                int count = inflater.inflate(buffer);
                outputStream.write(buffer, 0, count);
            }
            outputStream.close();
        } catch (IOException | DataFormatException ignored) {
        }
        return outputStream.toByteArray();
    }


    // periodic check of the assignment expiration date: if expirated, set it to "EXPIRED" status
    @Scheduled(initialDelay = 6 * 1000, fixedRate = 10 * 1000)
    public void checkExpired() {
        homeworkRepository.findAll().forEach(homework -> {
            if (homework.getAssignment().getExpirationDate().before(new Timestamp(System.currentTimeMillis()))) {
                homework.setExpired();
                homeworkRepository.save(homework);
            }
        });
    }

}
