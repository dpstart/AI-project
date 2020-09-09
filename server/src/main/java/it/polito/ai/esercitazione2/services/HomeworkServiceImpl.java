package it.polito.ai.esercitazione2.services;


import it.polito.ai.esercitazione2.dtos.HomeworkDTO;
import it.polito.ai.esercitazione2.entities.Assignment;
import it.polito.ai.esercitazione2.entities.Homework;
import it.polito.ai.esercitazione2.entities.Image;

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
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;

import static it.polito.ai.esercitazione2.services.TeamServiceImpl.compressBytes;


@Service
@Transactional
@Log(topic = "Homework Service")
public class  HomeworkServiceImpl implements HomeworkService {

    @Autowired
    AssignmentRepository assignmentRepository;

    @Autowired
    HomeworkRepository homeworkRepository;

    @Autowired
    StudentRepository studentRepository;

    @Autowired
    ProfessorRepository professorRepository;


    @Autowired
    ImageService imageService;

    @Autowired
    ModelMapper modelMapper;

    @Override
    public HomeworkDTO uploadHomework(Integer assignmentId, MultipartFile file){
        if(!assignmentRepository.existsById(assignmentId))
            throw new AssignmentNotFoundException("Assignment " + assignmentId + " not found");
        Assignment a = assignmentRepository.getOne(assignmentId);
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        Collection<? extends GrantedAuthority> roles = SecurityContextHolder.getContext().getAuthentication().getAuthorities();

        if(!studentRepository.existsById(principal))
                throw new StudentNotFoundException("Student " + principal + " not found");

        if(!studentRepository.getOne(principal).getCourses().contains(a.getCourse())){
                throw new StudentNotFoundException("Student " + principal + " is not enrolled in the course " + a.getCourse().getName());
        }

        Homework h = homeworkRepository.getHomeworkByStudentAndAssignment(principal, assignmentId);
        if(h.getIsFinal())
            throw new IllegalHomeworkStateChangeException("Homework is flagged as final, you can't upload a newer version");
        if(h.getState() == Homework.states.delivered)
            throw new IllegalHomeworkStateChangeException("You already delivered this homework, wait for the professor to review it");
        Image img = null;
        try {
            System.out.println(Arrays.toString(file.getBytes()));
            img = imageService.save(new Image(file.getContentType(), compressBytes(file.getBytes())));
        }
        catch (IOException e) {
            throw new ImageException("Homework content didn't load on database correctly");
        }
        if (img == null)
            throw new ImageException("Homework content didn't load on database correctly");
        h.getVersionIds().add(img.getId());
        h.getVersionDates().add(new Timestamp(System.currentTimeMillis()));
        h.setState(Homework.states.delivered);
        h = homeworkRepository.save(h);
        return modelMapper.map(h, HomeworkDTO.class);
    }

    @Override
    public HomeworkDTO reviewHomework(HomeworkDTO dto) {
        if(!homeworkRepository.existsById(dto.getId()))
            throw new HomeworkNotFoundException("Homework " + dto.getId() + " not found");
        Homework h = homeworkRepository.getOne(dto.getId());
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        Collection<? extends GrantedAuthority> roles = SecurityContextHolder.getContext().getAuthentication().getAuthorities();
        if(roles.contains(new SimpleGrantedAuthority("ROLE_PROFESSOR"))){
            if(!professorRepository.existsById(principal)){
                throw new ProfessorNotFoundException("Professor " + principal + " not found");
            }
            if(!professorRepository.getOne(principal).getCourses().contains(h.getAssignment().getCourse())){
                throw new ProfessorNotFoundException("Professor " + principal + " is not a teacher of the course " + h.getAssignment().getCourse().getName());
            }
        }
        h.setState(Homework.states.reviewed);
        h.setIsFinal(dto.getIsFinal());
        if(dto.getMark()!=0f)
            h.setMark(dto.getMark());
        h = homeworkRepository.save(h);
        return modelMapper.map(h, HomeworkDTO.class);
    }

    @Override
    public HomeworkDTO getHomework(Long id){
        if(!homeworkRepository.existsById(id))
            throw new HomeworkNotFoundException("Homework " + id + " not found");
        Homework h = homeworkRepository.getOne(id);
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        Collection<? extends GrantedAuthority> roles = SecurityContextHolder.getContext().getAuthentication().getAuthorities();
        if(roles.contains(new SimpleGrantedAuthority("ROLE_STUDENT"))){
            if(!studentRepository.existsById(principal)){
                throw new StudentNotFoundException("Student " + principal + " not found");
            }
            if(!studentRepository.getOne(principal).equals(h.getStudent())){
                throw new StudentNotFoundException("Student " + principal + " is not the owner of this homework");
            }
            if(h.getState() == Homework.states.unread) {
                h.setState(Homework.states.read);
                homeworkRepository.save(h);
            }
        }
        else if(roles.contains(new SimpleGrantedAuthority("ROLE_PROFESSOR"))){
            if(!professorRepository.existsById(principal)){
                throw new ProfessorNotFoundException("Professor " + principal + " not found");
            }
            if(!professorRepository.getOne(principal).getCourses().contains(h.getAssignment().getCourse())){
                throw new ProfessorNotFoundException("Professor " + principal + " is not a teacher of the course " + h.getAssignment().getCourse().getName());
            }
        }
        return modelMapper.map(h, HomeworkDTO.class);
    }

    @Override
    public Integer getAssignmentId(Long homeworkId) {
        if(!homeworkRepository.existsById(homeworkId))
            throw new HomeworkNotFoundException("Homework " + homeworkId + " not found");
        Homework h = homeworkRepository.getOne(homeworkId);
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        Collection<? extends GrantedAuthority> roles = SecurityContextHolder.getContext().getAuthentication().getAuthorities();
        if(roles.contains(new SimpleGrantedAuthority("ROLE_STUDENT"))){
            if(!studentRepository.existsById(principal)){
                throw new StudentNotFoundException("Student " + principal + " not found");
            }
            if(!studentRepository.getOne(principal).equals(h.getStudent())){
                throw new StudentNotFoundException("Student " + principal + " is not the owner of this homework");
            }
        }
        else if(roles.contains(new SimpleGrantedAuthority("ROLE_PROFESSOR"))){
            if(!professorRepository.existsById(principal)){
                throw new ProfessorNotFoundException("Professor " + principal + " not found");
            }
            if(!professorRepository.getOne(principal).getCourses().contains(h.getAssignment().getCourse())){
                throw new ProfessorNotFoundException("Professor " + principal + " is not a teacher of the course " + h.getAssignment().getCourse().getName());
            }
        }
        return h.getAssignment().getId();
    }

    @Override
    public Image getImage(Long homeworkId){
        return getImage(homeworkId, -1);
    }

    @Override
    public Image getImage(Long homeworkId, int version){
        if(!homeworkRepository.existsById(homeworkId))
            throw new HomeworkNotFoundException("Homework " + homeworkId + " not found");
        Homework h = homeworkRepository.getOne(homeworkId);
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        Collection<? extends GrantedAuthority> roles = SecurityContextHolder.getContext().getAuthentication().getAuthorities();
        if(roles.contains(new SimpleGrantedAuthority("ROLE_STUDENT"))){
            if(!studentRepository.existsById(principal)){
                throw new StudentNotFoundException("Student " + principal + " not found");
            }
            if(!studentRepository.getOne(principal).equals(h.getStudent())){
                throw new StudentNotFoundException("Student " + principal + " is not the owner of this homework");
            }
        }
        else if(roles.contains(new SimpleGrantedAuthority("ROLE_PROFESSOR"))){
            if(!professorRepository.existsById(principal)){
                throw new ProfessorNotFoundException("Professor " + principal + " not found");
            }
            if(!professorRepository.getOne(principal).getCourses().contains(h.getAssignment().getCourse())){
                throw new ProfessorNotFoundException("Professor " + principal + " is not a teacher of the course " + h.getAssignment().getCourse().getName());
            }
        }
        List<Long> ids = h.getVersionIds();
        if(ids.size() == 0)
            throw new IncoherenceException("This homework hasn't been delivered yet");
        if(version > ids.size() || version == -1)
            version = ids.size();
        return imageService.getImage(ids.get(version-1));
    }

    @Override
    public Timestamp getDeliveryDate(Long homeworkId, int version) {
        if(!homeworkRepository.existsById(homeworkId))
            throw new HomeworkNotFoundException("Homework " + homeworkId + " not found");
        Homework h = homeworkRepository.getOne(homeworkId);
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        Collection<? extends GrantedAuthority> roles = SecurityContextHolder.getContext().getAuthentication().getAuthorities();
        if(roles.contains(new SimpleGrantedAuthority("ROLE_STUDENT"))){
            if(!studentRepository.existsById(principal)){
                throw new StudentNotFoundException("Student " + principal + " not found");
            }
            if(!studentRepository.getOne(principal).equals(h.getStudent())){
                throw new StudentNotFoundException("Student " + principal + " is not the owner of this homework");
            }
        }
        else if(roles.contains(new SimpleGrantedAuthority("ROLE_PROFESSOR"))){
            if(!professorRepository.existsById(principal)){
                throw new ProfessorNotFoundException("Professor " + principal + " not found");
            }
            if(!professorRepository.getOne(principal).getCourses().contains(h.getAssignment().getCourse())){
                throw new ProfessorNotFoundException("Professor " + principal + " is not a teacher of the course " + h.getAssignment().getCourse().getName());
            }
        }
        List<Long> ids = h.getVersionIds();
        if(ids.size() == 0)
            throw new IncoherenceException("This homework hasn't been delivered yet");
        if(version > ids.size() || version == -1)
            version = ids.size();
        return h.getVersionDates().get(version-1);
    }

    @Override
    public List<Image> getAllImages(Long homeworkId){
        if(!homeworkRepository.existsById(homeworkId))
            throw new HomeworkNotFoundException("Homework " + homeworkId + " not found");
        Homework h = homeworkRepository.getOne(homeworkId);
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        Collection<? extends GrantedAuthority> roles = SecurityContextHolder.getContext().getAuthentication().getAuthorities();
        if(roles.contains(new SimpleGrantedAuthority("ROLE_STUDENT"))){
            if(!studentRepository.existsById(principal)){
                throw new StudentNotFoundException("Student " + principal + " not found");
            }
            if(!studentRepository.getOne(principal).equals(h.getStudent())){
                throw new StudentNotFoundException("Student " + principal + " is not the owner of this homework");
            }
        }
        else if(roles.contains(new SimpleGrantedAuthority("ROLE_PROFESSOR"))){
            if(!professorRepository.existsById(principal)){
                throw new ProfessorNotFoundException("Professor " + principal + " not found");
            }
            if(!professorRepository.getOne(principal).getCourses().contains(h.getAssignment().getCourse())){
                throw new ProfessorNotFoundException("Professor " + principal + " is not a teacher of the course " + h.getAssignment().getCourse().getName());
            }
        }
        List<Image> versions = new ArrayList<>();
        for(Long id : h.getVersionIds()){
            versions.add(imageService.getImage(id));
        }
        return versions;
    }

    @Override
    public String getHomeworkStudentId(Long homeworkId){
        if(!homeworkRepository.existsById(homeworkId))
            throw new HomeworkNotFoundException("Homework " + homeworkId + " not found");
        Homework h = homeworkRepository.getOne(homeworkId);
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        Collection<? extends GrantedAuthority> roles = SecurityContextHolder.getContext().getAuthentication().getAuthorities();
        if(roles.contains(new SimpleGrantedAuthority("ROLE_STUDENT"))){
            if(!studentRepository.existsById(principal)){
                throw new StudentNotFoundException("Student " + principal + " not found");
            }
            if(!studentRepository.getOne(principal).equals(h.getStudent())){
                throw new StudentNotFoundException("Student " + principal + " is not the owner of this homework");
            }
        }
        else if(roles.contains(new SimpleGrantedAuthority("ROLE_PROFESSOR"))){
            if(!professorRepository.existsById(principal)){
                throw new ProfessorNotFoundException("Professor " + principal + " not found");
            }
            if(!professorRepository.getOne(principal).getCourses().contains(h.getAssignment().getCourse())){
                throw new ProfessorNotFoundException("Professor " + principal + " is not a teacher of the course " + h.getAssignment().getCourse().getName());
            }
        }
        return h.getStudent().getId();
    }

    @Override
    public String getHomeworkCourse(Long homeworkId) {
        if(!homeworkRepository.existsById(homeworkId))
            throw new HomeworkNotFoundException("Homework " + homeworkId + " not found");
        Homework h = homeworkRepository.getOne(homeworkId);
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        Collection<? extends GrantedAuthority> roles = SecurityContextHolder.getContext().getAuthentication().getAuthorities();
        if(roles.contains(new SimpleGrantedAuthority("ROLE_STUDENT"))){
            if(!studentRepository.existsById(principal)){
                throw new StudentNotFoundException("Student " + principal + " not found");
            }
            if(!studentRepository.getOne(principal).equals(h.getStudent())){
                throw new StudentNotFoundException("Student " + principal + " is not the owner of this homework");
            }
        }
        else if(roles.contains(new SimpleGrantedAuthority("ROLE_PROFESSOR"))){
            if(!professorRepository.existsById(principal)){
                throw new ProfessorNotFoundException("Professor " + principal + " not found");
            }
            if(!professorRepository.getOne(principal).getCourses().contains(h.getAssignment().getCourse())){
                throw new ProfessorNotFoundException("Professor " + principal + " is not a teacher of the course " + h.getAssignment().getCourse().getName());
            }
        }
        return h.getAssignment().getCourse().getName();
    }
}
