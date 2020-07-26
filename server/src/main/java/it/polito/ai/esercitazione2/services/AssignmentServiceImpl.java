package it.polito.ai.esercitazione2.services;

import it.polito.ai.esercitazione2.dtos.AssignmentDTO;
import it.polito.ai.esercitazione2.entities.*;
import it.polito.ai.esercitazione2.exceptions.*;
import it.polito.ai.esercitazione2.repositories.*;
import lombok.extern.java.Log;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.transaction.Transactional;
import java.io.IOException;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import static it.polito.ai.esercitazione2.services.TeamServiceImpl.compressBytes;

@Service
@Transactional
@Log(topic = "Assignment Service")
public class AssignmentServiceImpl implements AssignmentService {

    @Autowired
    AssignmentRepository assignmentRepository;

    @Autowired
    HomeworkRepository homeworkRepository;

    @Autowired
    StudentRepository studentRepository;

    @Autowired
    ProfessorRepository professorRepository;

    @Autowired
    CourseRepository courseRepository;



    @Autowired
    ImageService imageService;

    @Autowired
    ModelMapper modelMapper;

    @Override
    public boolean addAssignment(AssignmentDTO a, MultipartFile file, String courseId){
        String professor = SecurityContextHolder.getContext().getAuthentication().getName();
        if(!professorRepository.existsById(professor))
            throw new CourseNotFoundException("Professor " + professor + " not found");
        if(!courseRepository.existsById(courseId) && !courseRepository.existsByAcronime(courseId))
            throw new CourseNotFoundException("Course " + courseId + " not found");
        Course c = courseRepository.getOne(courseId);
        // il docente è il docente del corso?
        if (!c.getProfessors().stream().anyMatch(x->x.getId().equals(professor)))
            throw new CourseAuthorizationException("User "+professor+ " has not the rights to modify this course: he's not the professor for this course");
        if (assignmentRepository.existsById(a.getId())) {
            if (getAssignment(a.getId()).equals(a))
                return false;
            else
                throw new IncoherenceException("Assignment with id "+ a.getId() +" already exist with different details");
        }
        Image img = null;
        try {
            img = imageService.save(new Image(file.getContentType(), compressBytes(file.getBytes())));
        }
        catch (IOException e) {
            throw new ImageException("Assignment content didn't load on database correctly");
        }
        if(img == null)
            throw new ImageException("Assignment content didn't load on database correctly");
        Assignment assignment = modelMapper.map(a, Assignment.class);
        assignment.setCourse(c);
        assignment.setContentId(img.getName());
        for(Student s : assignment.getCourse().getStudents()){
            Homework h = new Homework();
            h.setAssignment(assignment);
            h.setStudent(s);
            homeworkRepository.save(h);
        }
        assignment.setProfessor(professorRepository.getOne(professor));
        assignmentRepository.save(assignment);
        return true;
    }

    @Override
    public boolean removeAssignment(Integer id) {
        if(!assignmentRepository.existsById(id))
            return true;
        if(assignmentRepository.getOne(id).getHomeworks().stream().filter(
                h -> h.getState()!= Homework.states.unread
        ).collect(Collectors.toList()).size()>0)
            return false;
        assignmentRepository.delete(assignmentRepository.getOne(id));
        return true;
    }

    @Override
    public AssignmentDTO getAssignment(Integer id){
        if(!assignmentRepository.existsById(id))
            throw new AssignmentNotFoundException("Assignment " + id + " not found");
        Assignment a = assignmentRepository.getOne(id);
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        Collection<? extends GrantedAuthority> roles = SecurityContextHolder.getContext().getAuthentication().getAuthorities();
        if(roles.contains(new SimpleGrantedAuthority("ROLE_STUDENT"))){
            if(!studentRepository.existsById(principal)){
                throw new StudentNotFoundException("Student " + principal + " not found");
            }
            if(!studentRepository.getOne(principal).getCourses().contains(a.getCourse())){
                throw new StudentNotFoundException("Student " + principal + " is not enrolled in the course with the requested assignment");
            }
            Homework h = homeworkRepository.getHomeworkByStudentAndAssignment(principal, a.getId());
            if(h.getState() == Homework.states.unread) {
                h.setState(Homework.states.read);
                homeworkRepository.save(h);
            }
        }
        else if(roles.contains(new SimpleGrantedAuthority("ROLE_PROFESSOR"))){
            if(!professorRepository.existsById(principal)){
                throw new ProfessorNotFoundException("Professor " + principal + " not found");
            }
            if(!professorRepository.getOne(principal).getCourses().contains(a.getCourse())){
                throw new ProfessorNotFoundException("Professor " + principal + " is not a teacher of the course with the requested assignment");
            }
        }
        return modelMapper.map(a, AssignmentDTO.class);
    }

    @Override
    public List<AssignmentDTO> getAllAssignments(){
        return assignmentRepository.findAll()
                .stream()
                .map(a -> modelMapper.map(a, AssignmentDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public List<AssignmentDTO> getByCourse(String courseId){
        if(!courseRepository.existsById(courseId) && !courseRepository.existsByAcronime(courseId))
            throw new CourseNotFoundException("Course " + courseId+ " not found");

        Course course = courseRepository.getOne(courseId);
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        Collection<? extends GrantedAuthority> roles = SecurityContextHolder.getContext().getAuthentication().getAuthorities();
        if(roles.contains(new SimpleGrantedAuthority("ROLE_STUDENT"))){
            if(!studentRepository.existsById(principal)){
                throw new StudentNotFoundException("Student " + principal + " not found");
            }
            if(!studentRepository.getOne(principal).getCourses().contains(courseId)){
                throw new StudentNotFoundException("Student " + principal + " is not enrolled in the course " + course.getName());
            }
        }
        else if(roles.contains(new SimpleGrantedAuthority("ROLE_PROFESSOR"))){
            if(!professorRepository.existsById(principal)){
                throw new ProfessorNotFoundException("Professor " + principal + " not found");
            }
            if(!professorRepository.getOne(principal).getCourses().contains(courseId)){
                throw new ProfessorNotFoundException("Professor " + principal + " is not a teacher of the course " + course.getName());
            }
        }
        return assignmentRepository.getAssignmentsForCourse(courseId)
                .stream()
                .map(a -> modelMapper.map(a, AssignmentDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public List<AssignmentDTO> getByProfessor(String professorId){
        return assignmentRepository.getAssignmentsForProfessor(professorId)
                .stream()
                .filter(a -> {
                    String principal = SecurityContextHolder.getContext().getAuthentication().getName();
                    Collection<? extends GrantedAuthority> roles = SecurityContextHolder.getContext().getAuthentication().getAuthorities();
                    if(roles.contains(new SimpleGrantedAuthority("ROLE_STUDENT"))){
                        if(!studentRepository.existsById(principal)){
                            throw new StudentNotFoundException("Student " + principal + " not found");
                        }
                        if(!studentRepository.getOne(principal).getCourses().contains(a.getCourse())){
                            return false;
                        }
                    }
                    else if(roles.contains(new SimpleGrantedAuthority("ROLE_PROFESSOR"))){
                        if(!professorRepository.existsById(principal)){
                            throw new ProfessorNotFoundException("Professor " + principal + " not found");
                        }
                        if(!professorRepository.getOne(principal).getCourses().contains(a.getCourse())){
                            return false;
                        }
                    }
                    return true;
                })
                .map(a -> modelMapper.map(a, AssignmentDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public List<AssignmentDTO> getByStudent(String studentId){
        if(!studentRepository.existsById(studentId)){
            throw new StudentNotFoundException("Student " + studentId + " not found");
        }
        Student s = studentRepository.getOne(studentId);
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        Collection<? extends GrantedAuthority> roles = SecurityContextHolder.getContext().getAuthentication().getAuthorities();
        if(principal != studentId && !roles.contains(new SimpleGrantedAuthority("ROLE_ADMIN")))
            throw new UserUnathorizedException("User " + principal + " is not authorized to view assignments of student " + studentId);
        return s.getCourses()
                .stream()
                .flatMap(c -> c.getAssignments().stream())
                .map(a -> modelMapper.map(a, AssignmentDTO.class))
                .collect(Collectors.toList());
    }

    public Image getImage(AssignmentDTO assignment) {
        Assignment a = modelMapper.map(assignment, Assignment.class);
        return imageService.getImage(a.getContentId());
    }
}