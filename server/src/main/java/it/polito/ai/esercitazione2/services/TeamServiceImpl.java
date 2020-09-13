package it.polito.ai.esercitazione2.services;

import com.opencsv.CSVReader;
import com.opencsv.bean.CsvToBean;
import com.opencsv.bean.CsvToBeanBuilder;
import com.opencsv.exceptions.CsvValidationException;
import it.polito.ai.esercitazione2.config.JwtResponse;
import it.polito.ai.esercitazione2.config.JwtTokenUtil;
import it.polito.ai.esercitazione2.dtos.*;
import it.polito.ai.esercitazione2.entities.*;
import it.polito.ai.esercitazione2.exceptions.*;
import it.polito.ai.esercitazione2.repositories.*;
import net.minidev.json.JSONObject;
import org.apache.commons.text.RandomStringGenerator;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.AuthorizationServiceException;
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

    WebClient w = WebClient.create("http://localhost:8080");


    // Courses

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
    public CourseDTO updateCourse(CourseDTO c) {
        String prof = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!courseRepository.existsById(c.getName()) && !courseRepository.existsByAcronime(c.getAcronime()))
            throw new CourseNotFoundException("Course: " + c.getName() + " not found!");
        Course co = courseRepository.getOne(c.getName());
        if (co.getProfessors().stream().noneMatch(x -> x.getId().equals(prof)))
            throw new CourseAuthorizationException("Professor " + prof + "has not the rights to modify this course");

        String acronime = c.getAcronime();
        int min = c.getMin();
        int max = c.getMax();

        if (min > max)
            throw new IncoherenceException("Impossible to set a minimum number of members greater than the maximum one");

        co.setAcronime(acronime);

        if (co.getTeams().stream().map(x -> x.getMembers().size()).anyMatch((Integer x) -> x < min || x > max))
            throw new TeamSizeConstraintsException("Impossible to change members size constraints so that invalidate already existinf teams ");
        co.setMin(min);
        co.setMax(max);
        courseRepository.save(co);

        return modelMapper.map(co, CourseDTO.class);

    }

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
    public boolean addStudentToCourse(String studentId, String courseName) {
        String prof = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!courseRepository.existsById(courseName) && !courseRepository.existsByAcronime(courseName))
            throw new CourseNotFoundException("Course: " + courseName + " not found!");
        Course c = courseRepository.getOne(courseName);
        if (c.getProfessors().stream().noneMatch(x -> x.getId().equals(prof)) && !SecurityContextHolder.getContext().getAuthentication().getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN")))
            throw new CourseAuthorizationException("User " + prof + " has not the rights to modify this course: he's not the admin or the professor for this course");
        if (!studentRepository.existsById(studentId) || !studentRepository.getOne(studentId).getEnabled())
            throw new StudentNotFoundException("Student: " + studentId + " not found!");

        if (!c.getEnabled())
            throw new CourseNotEnabledException("Course " + courseName + " is not enabled");


        Student s = studentRepository.getOne(studentId);
        // TO DO: anyMatch(), equals() o compareTo
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
    public boolean removeStudentFromCourse(String studentId, String courseName) {
        String prof = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!courseRepository.existsById(courseName) && !courseRepository.existsByAcronime(courseName))
            throw new CourseNotFoundException("Course: " + courseName + " not found!");
        Course c = courseRepository.getOne(courseName);
        if (c.getProfessors().stream().noneMatch(x -> x.getId().equals(prof)) && !SecurityContextHolder.getContext().getAuthentication().getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN")))
            throw new CourseAuthorizationException("User " + prof + " has not the rights to modify this course: he's not the admin or the professor for this course");
        if (!studentRepository.existsById(studentId) || !studentRepository.getOne(studentId).getEnabled())
            throw new StudentNotFoundException("Student: " + studentId + " not found!");

        if (!c.getEnabled())
            throw new CourseNotEnabledException("Course " + courseName + " is not enabled");

        if (c.getStudents().stream().noneMatch(x -> x.getId().equals(studentId)))
            throw new StudentNotFoundException("Student: " + studentId + " not enrolled in this course!");


        Student s = studentRepository.getOne(studentId);

        // remove homerwork of the student
        // s.getHomeworks().stream().peek(x -> x.getVersionIds().forEach((Long y) -> imageService.remove(y))).forEach((Homework x) -> homeworkRepository.delete(x));
        // rimuovere relazione ownership con VM, se è l'unico rimuovere proprio la VM
        s.getVMs().stream().filter(x -> x.getOwners().size() == 1).peek(x -> imageService.remove(x.getImageId())).forEach((VM x) -> vmRepository.delete(x));
        // rimuovere dal team: se il team va sotto la soglia minima, rimuoverlo
        Team t = s.getTeams().stream().filter(x -> (x.getCourse().getName().equals(courseName) || x.getCourse().getAcronime().equals(courseName))).findFirst().orElse(null);

        if (t != null) {
            t.removeStudent(s);
            if (t.getMembers().size() < c.getMin())
                teamRepository.delete(t);
        }
        c.removeStudent(s);
        return true;
    }

    @Override
    public List<Boolean> unsubscribeAll(List<String> studentIds, String courseName) {
        return studentIds.stream().map(x -> removeStudentFromCourse(x, courseName)).collect(Collectors.toList());
    }


    // Professors
    @Override
    public boolean addProfessor(ProfessorDTO p, MultipartFile file) {
        if (professorRepository.existsById(p.getId())) {
            if (getProfessor(p.getId()).get().equals(p))
                return false;
            else
                throw new IncoherenceException("Professor with id " + p.getId() + " already exist with different names");
        }
        Image img = null;
        try {
            img = imageService.save(new Image(file.getContentType(), compressBytes(file.getBytes())));
        } catch (IOException e) {
        }
        Professor prof = modelMapper.map(p, Professor.class);
        String alias = prof.getFirstName().toLowerCase() + "." + prof.getName().toLowerCase();
        if (professorRepository.getByAlias(alias) != null) {
            int i = 3;
            for (alias += "2"; professorRepository.getByAlias(alias) != null; i++) {
                alias = alias.substring(0, alias.length() - Integer.toString(i - 1).length());
                alias += Integer.toString(i);
            }
        }
        prof.setAlias(alias);
        if (img != null)
            prof.setImage_id(img.getId());

        professorRepository.save(prof);


        if (!registerUser(p.getId(), enc.encode(p.getPassword()), "ROLE_PROFESSOR"))
            throw new AuthenticationServiceException("Some errors occurs with the registration of this new user in the system: retry!");
        notificationService.notifyProfessor(p);


        return true;
    }

    @Override
    public boolean addProfessor(ProfessorDTO p) {
        if (professorRepository.existsById(p.getId())) {
            if (getProfessor(p.getId()).get().equals(p))
                return false;
            else
                throw new IncoherenceException("Professor with id " + p.getId() + " already exist with different names");
        }

        Professor prof = modelMapper.map(p, Professor.class);
        String alias = prof.getFirstName().toLowerCase() + "." + prof.getName().toLowerCase();
        if (professorRepository.getByAlias(alias) != null) {
            int i = 3;
            for (alias += "2"; professorRepository.getByAlias(alias) != null; i++) {
                alias = alias.substring(0, alias.length() - Integer.toString(i - 1).length());
                alias += Integer.toString(i);
            }
        }
        prof.setAlias(alias);
        professorRepository.save(prof);


        if (!registerUser(p.getId(), enc.encode(p.getPassword()), "ROLE_PROFESSOR"))
            throw new AuthenticationServiceException("Some errors occurs with the registration of this new user in the system: retry!");
        notificationService.notifyProfessor(p);


        return true;
    }

    @Override
    public Optional<ProfessorDTO> getProfessor(String professorId) {
        return professorRepository.findById(professorId).filter(Professor::getEnabled).map(x -> modelMapper.map(x, ProfessorDTO.class));
    }

    //Students
    @Override
    public boolean addStudent(StudentDTO s, boolean notify, MultipartFile file) {
        if (studentRepository.existsById(s.getId())) {
            if (getStudent(s.getId()).get().equals(s))
                return false;
            else
                throw new IncoherenceException("Student with id " + s.getId() + " already exist with different names");
        }
        Image img = null;
        try {
            img = new Image(file.getContentType(), compressBytes(file.getBytes()));
            img = imageService.save(img);
        } catch (IOException e) {
        }
        Student stud = modelMapper.map(s, Student.class);
        String alias = stud.getFirstName().toLowerCase() + "." + stud.getName().toLowerCase();
        if (studentRepository.getByAlias(alias) != null) {
            int i = 3;
            for (alias += "2"; studentRepository.getByAlias(alias) != null; i++) {
                alias = alias.substring(0, alias.length() - Integer.toString(i - 1).length());
                alias += Integer.toString(i);
            }
        }
        stud.setAlias(alias);
        if (img != null)
            stud.setImage_id(img.getId());

        studentRepository.save(stud);


        if (notify) {

            if (!registerUser(stud.getId(), enc.encode(s.getPassword()), "ROLE_STUDENT"))
                throw new AuthenticationServiceException("Some errors occurs with the registration of this new user in the system: retry!");
            notificationService.notifyStudent(s);

        }

        return true;
    }

    //Students
    @Override
    public boolean addStudent(StudentDTO s, boolean notify) {
        if (studentRepository.existsById(s.getId())) {
            if (getStudent(s.getId()).get().equals(s))
                return false;
            else
                throw new IncoherenceException("Student with id " + s.getId() + " already exist with different names");
        }
        Student stud = modelMapper.map(s, Student.class);

        String alias = stud.getFirstName().toLowerCase() + "." + stud.getName().toLowerCase();
        if (studentRepository.getByAlias(alias) != null) {
            int i = 3;
            for (alias += "2"; studentRepository.getByAlias(alias) != null; i++) {
                alias = alias.substring(0, alias.length() - Integer.toString(i - 1).length());
                alias += Integer.toString(i);
            }
        }
        stud.setAlias(alias);

        studentRepository.save(stud);


        if (notify) {

            if (!registerUser(stud.getId(), enc.encode(s.getPassword()), "ROLE_STUDENT"))
                throw new AuthenticationServiceException("Some errors occurs with the registration of this new user in the system: retry!");
            notificationService.notifyStudent(s);

        }

        return true;
    }


    public boolean registerUser(String id, String pwd, String role) {


        List<String> roles = new ArrayList<>();
        roles.add(role);
        Boolean a = w.post()
                .uri("/register")
                .body(Mono.just(jwtTokenUtil.generateRegisterRequest(id, pwd, roles)), JwtResponse.class)
                /*
                .exchange().flatMap(x->{
                    if (x.statusCode().is4xxClientError()||x.statusCode().is5xxServerError()) {
                        Mono<String> msg=x.bodyToMono(String.class);
                        return msg.flatMap(y->{
                            throw new AuthenticationServiceException(y);
                        });
                    }
                    return  x.bodyToMono(String.class);
                })
                .subscribe(response -> {
                    if (dto instanceof StudentDTO)
                        notificationService.notifyStudent((StudentDTO) dto, pwd);
                    else if (dto instanceof ProfessorDTO)
                        notificationService.notifyProfessor((ProfessorDTO) dto, pwd);
                });

                 */
                .retrieve()
                .bodyToMono(Boolean.class)
                .block();
        // .onStatus(HttpStatus::is4xxClientError, response -> Mono.error(new CustomRuntimeException("Error")));

        if (a == null)
            return false;
        else
            return a;
                    /*
                    .subscribe(response -> {
                        if (dto instanceof StudentDTO)
                            notificationService.notifyStudent((StudentDTO) dto, pwd);
                        else if (dto instanceof ProfessorDTO)
                            notificationService.notifyProfessor((ProfessorDTO) dto, pwd);
                    });

                     */


    }

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


    // Operations on multiple students

    @Override
    public List<Boolean> addAll(List<StudentDTO> students, boolean notify) {
        List<Boolean> res = students.stream().map(x -> addStudent(x, false)).collect(Collectors.toList());


        if (notify) {
            Map<Integer, String> pwds = new HashMap<>();
            for (int i = 0; i < students.size(); i++) {
                if (res.get(i)) {


                    pwds.put(i, students.get(i).getPassword());
                }
            }
            if (!registerUsers(pwds.entrySet().stream().collect(Collectors.toMap(x -> students.get(x.getKey()).getId(), x -> enc.encode(x.getValue()))), "ROLE_STUDENT"))
                throw new AuthenticationServiceException("Some errors occurs with the registration of users in the system: retry!");

            for (Integer pos : pwds.keySet())
                notificationService.notifyStudent(students.get(pos));
        }
        return res;
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

/*
        CsvToBean<String> users = new CsvToBeanBuilder(r)
                .withType(String.class)
                .withIgnoreLeadingWhiteSpace(true)
                .build();
        // convert `CsvToBean` object to list of users
        // List<StudentDTO> users = csvToBean.parse();
        = users.stream()
                                .collect(Collectors.toList());

 */

        List<Boolean> resEnroll = enrollAll(users_ids, courseName);

        /*//check for incoherence
        users.forEach(x -> {
            if (!getStudent(x.getId()).get().equals(x))
                throw new IncoherenceException("Student with id " + x.getId() + " already exist with different names");
        });

         */


        return resEnroll;

    }

    @Override
    public List<Boolean> addAndEnroll(Reader r, String courseName) {
        // create csv bean reader

        CsvToBean<StudentDTO> csvToBean = new CsvToBeanBuilder(r)
                .withType(StudentDTO.class)
                .withIgnoreLeadingWhiteSpace(true)
                .build();

        // convert `CsvToBean` object to list of users
        List<StudentDTO> users = csvToBean.parse();
        List<String> users_ids = users.stream().map(StudentDTO::getId).collect(Collectors.toList());
        List<Boolean> resAdd = addAll(users, false);


        List<Boolean> resEnroll = enrollAll(users_ids, courseName);

        Map<Integer, String> pwds = new HashMap<>();
        for (int i = 0; i < resAdd.size(); i++) {

            // paranoia
            if (resAdd.get(i) && !resEnroll.get(i))
                throw new NotExpectedStatusException("It's impossible that a not existing student is already enrolled in a course");

            if (resAdd.get(i)) {


                pwds.put(i, users.get(i).getPassword());
            }
            resAdd.set(i, resAdd.get(i) | resEnroll.get(i));
        }

        if (!registerUsers(pwds.entrySet().stream().collect(Collectors.toMap(x -> users.get(x.getKey()).getId(), x -> enc.encode(x.getValue()))), "ROLE_STUDENT"))
            throw new AuthenticationServiceException("Some errors occurs with the registration of users in the system: retry!");
        for (Integer pos : pwds.keySet())
            notificationService.notifyStudent(users.get(pos));

        return resAdd;
    }

    @Override
    public List<TeamDTO> getTeamsforStudent(String studentId) {
        if (!studentRepository.existsById(studentId) || !studentRepository.getOne(studentId).getEnabled())
            throw new StudentNotFoundException("Student: " + studentId + " not found!");
        Student s = studentRepository.getOne(studentId);
        return s.getTeams()
                .stream()
                .filter(t -> t.getCourse() != null)
                .map(x -> modelMapper.map(x, TeamDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public List<TeamDTO> getTeamsforStudentAndCourse(String studentId, String courseId) {
        if (!studentRepository.existsById(studentId) || !studentRepository.getOne(studentId).getEnabled()) {
            throw new StudentNotFoundException("Student: " + studentId + " not found!");
        }
        Student s = studentRepository.getOne(studentId);
        return s.getTeams()
                .stream()
                .filter(t -> (t.getCourse().getName().equals(courseId) || t.getCourse().getAcronime().equals(courseId)))
                .map(x -> modelMapper.map(x, TeamDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public String getTeamCourse(Long teamId) {
        if (!teamRepository.existsById(teamId) || teamRepository.getOne(teamId).getCourse() == null)
            throw new TeamNotFoundException("Team " + teamId + " not found");
        return teamRepository.getOne(teamId).getCourse().getName();
    }

    @Override
    public List<StudentDTO> getMembers(String courseName, Long teamID) {
        if (!courseRepository.existsById(courseName) && !courseRepository.existsByAcronime(courseName))
            throw new CourseNotFoundException("Course: " + courseName + " not found!");
        Course c = courseRepository.getOne(courseName);
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        // il principal è un docente o studente del corso? o
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

    @Override
    public TeamDTO proposeTeam(String courseId, String name, List<String> memberIds, Long duration) {
        String proposer = SecurityContextHolder.getContext().getAuthentication().getName();

        // il corso esiste?
        if (!courseRepository.existsById(courseId) && !courseRepository.existsByAcronime(courseId))
            throw new CourseNotFoundException("Course: " + courseId + " not found!");
        Course c = courseRepository.getOne(courseId);
        // il corso è abilitato?
        if (!c.getEnabled())
            throw new CourseNotEnabledException("Course: " + courseId + " is not enabled!");

        if (memberIds.size() == 0)
            throw new TeamSizeConstraintsException("It need to specify at least one student for  a team");

        if (!memberIds.contains(proposer))
            memberIds.add(proposer);
        List<Student> enrolled = c.getStudents();

        // retrieval delle entities e controllo se lo studente esiste e se è iscritto al corso
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

        //check se esiste un team con lo stesso nome nel corso
        boolean nameAlreadyPresent = teams.stream().map(Team::getName).anyMatch(x -> x.equals(name));

        if (nameAlreadyPresent)
            throw new TeamNameAlreadyPresentInCourse("A team with this name already exists for this course");

        // check se già in un gruppo associato a quel corso
        boolean alreadyInATeam = members.stream()
                .flatMap(x -> x.getTeams().stream().filter(t -> t.getStatus() == 1))
                .anyMatch(teams::contains);
        if (alreadyInATeam)
            throw new AlreadyInACourseTeamException("One or more among specified students is already part of a team inside course " + courseId);

        Set<String> set = new HashSet<String>(memberIds);

        if (set.size() < memberIds.size())
            throw new DuplicatePartecipantsException("Duplicated team members");

        if (memberIds.size() < c.getMin() || memberIds.size() > c.getMax())
            throw new TeamSizeConstraintsException("Size costraints for teams in course " + courseId + " Min: " + c.getMin() + " Max: " + c.getMax());

        if (teams.stream()
                .anyMatch(x -> x.getMembers()
                        .stream()
                        .map(s -> s.getId())
                        .collect(Collectors.toList())
                        .containsAll(memberIds))) {
            throw new DuplicateTeamException("A team proposal with the same members is already existing");
        }


        Team t = new Team();
        t.setName(name);
        t.setCourse(c);
        t.setStatus(0);
        t.setId_creator(proposer);

        for (Student s : members)
            t.addStudent(s);

        TeamDTO dto = modelMapper.map(teamRepository.save(t), TeamDTO.class);
        memberIds.remove(proposer);
        notificationService.notifyTeam(dto, memberIds, duration);
        return dto;

    }

    @Override
    public TeamDTO setSettings(String courseName, Long teamId, SettingsDTO settings) {
        String prof = SecurityContextHolder.getContext().getAuthentication().getName();


        // il corso esiste?
        if (!courseRepository.existsById(courseName) && !courseRepository.existsByAcronime(courseName))
            throw new CourseNotFoundException("Course: " + courseName + " not found!");
        Course c = courseRepository.getOne(courseName);
        // il docente è il docente del corso?
        if (c.getProfessors().stream().noneMatch(x -> x.getId().equals(prof)))
            throw new CourseAuthorizationException("User " + prof + " has not the rights to modify this course: he's not the professor for this course");
        // il team esiste?
        if (!teamRepository.existsById(teamId))
            throw new TeamNotFoundException("Team: " + teamId + " not found!");

        Team t = teamRepository.getOne(teamId);

        //check  se il team è associato al corso
        if (!t.getCourse().getName().equals(courseName) && !t.getCourse().getAcronime().equals(courseName))
            throw new IncoherenceException("Team " + teamId + " doens't belong to this course");

        //check on the single fields

        if (settings.getMax_active() > settings.getMax_available())
            throw new NotExpectedStatusException("It's not possible assign a maximum value for active machines greater than the available one!");

        // check che siano almeno pari a quelle già occupate in caso di modifiche a runtime

        if (t.getVMs().size() > settings.getMax_available() ||
                t.getVMs().stream().map(VM::getRam).mapToInt(Integer::intValue).sum() > settings.getRam() ||
                t.getVMs().stream().map(VM::getDisk_space).mapToInt(Integer::intValue).sum() > settings.getDisk_space() ||
                t.getVMs().stream().map(VM::getN_cpu).mapToInt(Integer::intValue).sum() > settings.getN_cpu() ||
                t.getVMs().stream().map(VM::getStatus).mapToInt(Integer::intValue).sum() > settings.getMax_active())
            throw new NotExpectedStatusException("It's not possible assign less resources than already allocated!");

        //AGGIUNGERE CONTROLLO RELATIVO A RIMODULAZIONE DELLE MACCHINE ATTIVE


        t.setN_cpu(settings.getN_cpu());
        t.setDisk_space(settings.getDisk_space());
        t.setRam(settings.getRam());
        t.setMax_active(settings.getMax_active());
        t.setMax_available(settings.getMax_available());


        return modelMapper.map(teamRepository.save(t), TeamDTO.class);
    }


    @Override
    public List<TeamDTO> getTeamForCourse(String courseName) {
        if (!courseRepository.existsById(courseName) && !courseRepository.existsByAcronime(courseName))
            throw new CourseNotFoundException("Course: " + courseName + " not found!");

        String principal = SecurityContextHolder.getContext().getAuthentication().getName();

        Course c = courseRepository.getOne(courseName);
        // il principal è un docente o studente del corso? o
        if (c.getProfessors().stream().noneMatch(x -> x.getId().equals(principal)) && c.getStudents().stream().noneMatch(x -> x.getId().equals(principal)))
            throw new CourseAuthorizationException("User " + principal + " has not the rights to see the teams for this course");

        return teamRepository.getByCourse(c).stream().map(x -> modelMapper.map(x, TeamDTO.class))
                .collect(Collectors.toList());

    }

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


    @Override
    public List<StudentDTO> getStudentsInTeams(String courseName) {
        if (!courseRepository.existsById(courseName) && !courseRepository.existsByAcronime(courseName))
            throw new CourseNotFoundException("Course: " + courseName + " not found!");
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        Course c = courseRepository.getOne(courseName);

        // il principal è un docente o studente del corso? o
        if (c.getProfessors().stream().noneMatch(x -> x.getId().equals(principal)) && c.getStudents().stream().noneMatch(x -> x.getId().equals(principal)))
            throw new CourseAuthorizationException("User " + principal + " has not the rights to see the teams for this course");

        return courseRepository.getStudentsInTeams(courseName)
                .stream()
                .map(x -> modelMapper.map(x, StudentDTO.class))
                .collect(Collectors.toList());
    }


    @Override
    public List<StudentDTO> getAvailableStudents(String courseName) {
        if (!courseRepository.existsById(courseName) && !courseRepository.existsByAcronime(courseName))
            throw new CourseNotFoundException("Course: " + courseName + " not found!");
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        Course c = courseRepository.getOne(courseName);

        // il principal è un docente o studente del corso? o
        if (c.getProfessors().stream().noneMatch(x -> x.getId().equals(principal)) && c.getStudents().stream().noneMatch(x -> x.getId().equals(principal)))
            throw new CourseAuthorizationException("User " + principal + " has not the rights to see the teams for this course");

        return courseRepository.getStudentsNotInTeams(courseName)
                .stream()
                .filter(Student::getEnabled)
                .map(x -> modelMapper.map(x, StudentDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public boolean activateTeam(Long ID) {
        Optional<Team> t = teamRepository.findById(ID);
        if (t.isEmpty())
            return false;
        t.get().setStatus(1);
        for (Student s : t.get().getMembers()) {
            s.getTeams().stream()
                    .filter(x -> x.getCourse() == t.get().getCourse() && x.getStatus() == 0)
                    .forEach(x -> {
                        evictTeam(x.getId());
                    });
        }
        return true;
    }

    @Override
    public List<Boolean> evictAll(Set<Long> teams) {
        return teams.stream().map(this::evictTeam).collect(Collectors.toList());
    }

    @Override
    public boolean evictTeam(Long ID) {
        Optional<Team> t = teamRepository.findById(ID);
        if (t.isEmpty())
            return false;
        Team team = t.get();
        team.setCourse(null);
        return true;
    }

    @Override
    public List<ProfessorDTO> getAllProfessors() {
        return professorRepository.findAll()
                .stream()
                .filter(Professor::getEnabled)
                .map(s -> modelMapper.map(s, ProfessorDTO.class))
                .collect(Collectors.toList());
    }

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
                /*
                .exchange().flatMap(x->{
                    if (x.statusCode().is4xxClientError()||x.statusCode().is5xxServerError()) {
                        Mono<String> msg=x.bodyToMono(String.class);
                        return msg.flatMap(y->{
                            throw new AuthenticationServiceException(y);
                        });
                    }
                    return  x.bodyToMono(String.class);
                })
                .subscribe(response -> {
                    if (dto instanceof StudentDTO)
                        notificationService.notifyStudent((StudentDTO) dto, pwd);
                    else if (dto instanceof ProfessorDTO)
                        notificationService.notifyProfessor((ProfessorDTO) dto, pwd);
                });

                 */
                /*.retrieve()
                .bodyToMono(Boolean.class)
                .block();
        // .onStatus(HttpStatus::is4xxClientError, response -> Mono.error(new CustomRuntimeException("Error")));

        if (a==null)
            return false;
        else
            return a;
                    /*
                    .subscribe(response -> {
                        if (dto instanceof StudentDTO)
                            notificationService.notifyStudent((StudentDTO) dto, pwd);
                        else if (dto instanceof ProfessorDTO)
                            notificationService.notifyProfessor((ProfessorDTO) dto, pwd);
                    });

                     */
    }

    public void removeAccount(String id) {
        //TO DO: gestire eventuali casi di errore con il reinvio


        w.post()
                .uri("/remove")
                .body(Mono.just(jwtTokenUtil.generateIdRequest(id)), JwtResponse.class)
                .exchange()
                .subscribe();

    }


    public void removeAccounts(Set<String> users) {
        //TO DO: gestire eventuali casi di errore con il reinvio
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


    @Override
    public void deleteAll(Set<String> users) {
        studentRepository.deleteAll(users.stream().filter(x -> studentRepository.existsById(x)).map(x -> studentRepository.getOne(x)).collect(Collectors.toList()));
        professorRepository.deleteAll(users.stream().filter(x -> professorRepository.existsById(x)).map(x -> professorRepository.getOne(x)).collect(Collectors.toList()));
        removeAccounts(users);
    }


    @Override
    public Map<String, String> getAdhesionInfo(Long teamID) {

        Team t = teamRepository.getOne(teamID);
        Map<String, String> m = new HashMap<>();
        List<Student> members = t.getMembers();
        if (!members.stream().map(Student::getId).anyMatch(x -> x.equals(SecurityContextHolder.getContext().getAuthentication().getName())))
            throw new AuthorizationServiceException("Student not belonging to this team");


        List<Token> tokens = tokenRepository.findAllByTeamId(teamID);

        for (Student s : members) {
            String token = notificationService.getToken(s.getId(), t.getId());

            if (token == null) { //ha già accettato
                token = "true";
            } else {
                if (!s.getId().equals(SecurityContextHolder.getContext().getAuthentication().getName())) {
                    token = "false";
                }
            }
            m.put(s.getId(), token);
        }
        return m;
    }


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
