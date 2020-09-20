package it.polito.ai.esercitazione2.services;

import it.polito.ai.esercitazione2.dtos.ImageDTO;
import it.polito.ai.esercitazione2.dtos.SettingsDTO;
import it.polito.ai.esercitazione2.dtos.VMDTO;
import it.polito.ai.esercitazione2.dtos.VMModelDTO;
import it.polito.ai.esercitazione2.entities.*;
import it.polito.ai.esercitazione2.exceptions.*;
import it.polito.ai.esercitazione2.repositories.*;
import lombok.extern.java.Log;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AuthorizationServiceException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.transaction.Transactional;
import javax.validation.constraints.NotNull;
import java.io.IOException;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import static it.polito.ai.esercitazione2.services.TeamServiceImpl.compressBytes;

/**
 * The functions in this service are divided in:
 *             * VM models;
 *             * VM instances: operation;
 *             * VM instances: getters;
 */


@Service
@Transactional
@Log(topic = "VM Service")
public class VMServiceImpl implements VMService {

    @Autowired
    VMModelRepository vmModelRepository;

    @Autowired
    VMRepository vmRepository;

    @Autowired
    TeamRepository teamRepository;

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

    /*****************************************************************************
     *
     ******************************* VM MODELS ***********************************
     *
     *****************************************************************************/

    // the admin creates a vmm model
    @Override
    public boolean createVMModel(String modelName){
        if (vmModelRepository.existsById(modelName)){
            return false;
        }
        VMModel vmm=new VMModel();
        vmm.setName(modelName);
        vmModelRepository.save(vmm);
        return true;
    }

    // the admin removes the specified vmmmodel
    @Override
    public boolean removeVMModel(String modelName) {
        if (!vmModelRepository.existsById(modelName)){
            return false;
        }
        VMModel vmModel = vmModelRepository.getOne(modelName);
        if (vmModel.getCourses().stream().flatMap(x->x.getTeams().stream()).anyMatch(x->x.getVMs().size()>0))
            throw new IncoherenceException("Impossible to remove a VM model for which a VM instance has already been created");
        vmModelRepository.delete(vmModel);
        return true;
    }

    // define the VM model for a course
    @Override
    public void defineVMModel(String courseId, String modelName){
        String creator = SecurityContextHolder.getContext().getAuthentication().getName();

        if (!courseRepository.existsById(courseId) && !courseRepository.existsByAcronime(courseId))
            throw new CourseNotFoundException("course: "+courseId + " not found!");

        Course c = courseRepository.getOne(courseId);

        if (!c.getProfessors().stream().anyMatch(x->x.getId().equals(creator)))
            throw new AuthorizationServiceException("Unauthorized to create VM's instances for this course");

        if (c.getVm_model()!=null && c.getTeams().stream().anyMatch(x->x.getVMs().size()>0))
            throw new IncoherenceException("Impossible to change the VM model for a group with already instantiated VMs");

        if (!vmModelRepository.existsById(modelName)){
            throw new VMModelNotFoundException("VM model: "+modelName + " not found!");
        }

        VMModel vm=vmModelRepository.getOne(modelName);
        c.setVm_model(vm);
        courseRepository.save(c);
    }

    @Override
    public List<VMModelDTO> getVMModels(){
        return vmModelRepository.findAll()
                .stream()
                .map(c->modelMapper.map(c,VMModelDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public VMModelDTO getVMModel(String modelName){
        if (!vmModelRepository.existsById(modelName))
            throw new VMModelNotFoundException("No defined module for "+modelName);
        return modelMapper.map(vmModelRepository.getOne(modelName),VMModelDTO.class);
    }

    /*****************************************************************************
     *
     ******************* VM INSTANCES: operation  ********************************
     *
     *****************************************************************************/


    @Override
    public VMDTO createVM(String courseName, Long teamId, MultipartFile file, SettingsDTO settings){
        String creator = SecurityContextHolder.getContext().getAuthentication().getName();

        if (!teamRepository.existsById(teamId))
            throw new TeamNotFoundException("Team: "+teamId + " not found!");

        Team t = teamRepository.getOne(teamId);



        // only a team meber can create a VM instance
        if (!t.getMembers().stream().anyMatch(x->x.getId().equals(creator)))
            throw new AuthorizationServiceException("Unauthorized to create VM's instances for this team");

        // it's not possible create a vm for a course wiht no vm model associated
        if (t.getCourse().getVm_model()==null)
            throw new VMModelNotDefinedException("Impossible to create an instance of VM without a defined model");


        if (!t.getCourse().getName().equals(courseName) && !t.getCourse().getAcronime().equals(courseName) )
            throw new CourseAuthorizationException("Not a VM of the course "+ courseName);


        // check on the availability of tha available resources
        if (t.getVMs().size()==t.getMax_available()||
                t.getVMs().stream().map(VM::getRam).mapToInt(Integer::intValue).sum()+settings.getRam()>t.getRam() ||
                t.getVMs().stream().map(VM::getDisk_space).mapToInt(Integer::intValue).sum()+settings.getDisk_space()>t.getDisk_space() ||
                t.getVMs().stream().map(VM::getN_cpu).mapToInt(Integer::intValue).sum()+settings.getN_cpu()>t.getN_cpu())

            throw new UnavailableResourcesForTeamException("The upper limit for usable resources has been exceeded");

        VM vm = new VM();
        vm.setN_cpu(settings.getN_cpu());
        vm.setDisk_space(settings.getDisk_space());
        vm.setRam(settings.getN_cpu());
        vm.addOwner(studentRepository.getOne(creator));
        vm.setId_creator(creator);
        t.addVM(vm);
        Image img = null;
        try {
            img = imageService.save(new Image(file.getContentType(), compressBytes(file.getBytes())));
        }
        catch (IOException e) {
            throw new ImageException("VM image didn't load on database correctly");
        }
        if(img == null)
            throw new ImageException("VM image didn't load on database correctly");
        vm.setImageId(img.getId());

        vmRepository.save(vm);


        VMDTO dto = modelMapper.map(vm,VMDTO.class);

        return dto;
    }


    // only a student owning a VM can run it
    @Override
    public void runVM(Long vmID){
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();

        if(!vmRepository.existsById(vmID))
            throw new VMInstanceNotFoundException("Instance "+vmID + " not found!");

        VM vm = vmRepository.getOne(vmID);

        if (!vm.getOwners().stream().anyMatch(x->x.getId().equals(principal))){
            throw new TeamAuthorizationException("Current user is not an owner of this machine");
        }

        if (!vm.getTeam().getCourse().getEnabled())
            throw new CourseNotEnabledException("Impossible to use VMs of a disabled course");

        if (vm.getStatus()==1){
            throw new VMAlreadyInExecutionException("This instance is already running");
        }

        Team t= vm.getTeam();

        if (t.getVMs().stream().mapToInt(VM::getStatus).sum()==t.getMax_active())
            throw new UnavailableResourcesForTeamException("Maximum number of contemporary active VM instances exceeded");

        vm.setStatus(1);
        vmRepository.save(vm);

    }

    @Override
    public void updateVM(Long vmID, MultipartFile file, SettingsDTO settings){
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();

        if(!vmRepository.existsById(vmID))
            throw new VMInstanceNotFoundException("Instance "+vmID + " not found!");

        VM vm = vmRepository.getOne(vmID);

        if (!vm.getOwners().stream().anyMatch(x->x.getId().equals(principal))){
            throw new TeamAuthorizationException("Current user is not an owner of this machine");
        }


        if (vm.getStatus()==1){
            throw new VMAlreadyInExecutionException("Running instance"); // TO DO: cambiare
        }

        Team t= vm.getTeam();

        List<VM> vms=t.getVMs().stream().filter(x->!x.getId().equals(vm.getId())).collect(Collectors.toList());

        if (vms.size()==t.getMax_available()||
                vms.stream().map(VM::getRam).mapToInt(Integer::intValue).sum()+settings.getRam()>t.getRam() ||
                vms.stream().map(VM::getDisk_space).mapToInt(Integer::intValue).sum()+settings.getDisk_space()>t.getDisk_space() ||
                vms.stream().map(VM::getN_cpu).mapToInt(Integer::intValue).sum()+settings.getN_cpu()>t.getN_cpu())

            throw new UnavailableResourcesForTeamException("The upper limit for usable resources has been exceeded");

        vm.setN_cpu(settings.getN_cpu());
        vm.setDisk_space(settings.getDisk_space());
        vm.setRam(settings.getRam() );

        Image img = null;
        try {
            imageService.remove(vm.getImageId());
            img = imageService.save(new Image(file.getContentType(), compressBytes(file.getBytes())));
        }
        catch (IOException e) {
            throw new ImageException("VM image didn't load on database correctly");
        }
        if(img == null)
            throw new ImageException("VM image didn't load on database correctly");

        vm.setImageId(img.getId());
        vmRepository.save(vm);
    }

    // an owner of the team can update it
    @Override
    public void updateVM(Long vmID, SettingsDTO settings){

        String principal = SecurityContextHolder.getContext().getAuthentication().getName();

        if(!vmRepository.existsById(vmID))
            throw new VMInstanceNotFoundException("Instance "+vmID + " not found!");

        VM vm = vmRepository.getOne(vmID);

        if (!vm.getOwners().stream().anyMatch(x->x.getId().equals(principal))){
            throw new TeamAuthorizationException("Current user is not an owner of this machine");
        }


        // it's possible to update the vM only if it's not running
        if (vm.getStatus()==1){
            throw new VMAlreadyInExecutionException("Running instance");
        }

        Team t= vm.getTeam();

        List<VM> vms=t.getVMs().stream().filter(x->!x.getId().equals(vm.getId())).collect(Collectors.toList());

        // check of the constraints
        if (vms.size()==t.getMax_available()||
               vms.stream().map(VM::getRam).mapToInt(Integer::intValue).sum()+settings.getRam()>t.getRam() ||
                vms.stream().map(VM::getDisk_space).mapToInt(Integer::intValue).sum()+settings.getDisk_space()>t.getDisk_space() ||
                vms.stream().map(VM::getN_cpu).mapToInt(Integer::intValue).sum()+settings.getN_cpu()>t.getN_cpu())

            throw new UnavailableResourcesForTeamException("The upper limit for usable resources has been exceeded");

        vm.setN_cpu(settings.getN_cpu());
        vm.setDisk_space(settings.getDisk_space());
        vm.setRam(settings.getRam());

        vmRepository.save(vm);
    }

    // a professor of a course or a student of the teams associated to the VM can connect to it, i.e. receive the VM's image
    @Override
    public ImageDTO connectToVM(Long vmID){
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();

        if(!vmRepository.existsById(vmID))
            throw new VMInstanceNotFoundException("Instance "+vmID + " not found!");

        VM vm = vmRepository.getOne(vmID);
        Collection<? extends GrantedAuthority> roles = SecurityContextHolder.getContext().getAuthentication().getAuthorities();
        if(roles.contains(new SimpleGrantedAuthority("ROLE_STUDENT"))){
            // if it's a student, check it exists and it is part of the team associated to the VM
            if(!studentRepository.existsById(principal)){
                throw new StudentNotFoundException("Student " + principal + " not found");
            }
            if(!studentRepository.getOne(principal).getTeams().contains(vm.getTeam())){
                throw new StudentNotFoundException("Student " + principal + " is not part of the team owner of this machine");
            }
        }
        else if(roles.contains(new SimpleGrantedAuthority("ROLE_PROFESSOR"))){
            // if it's a professor, check it exists and it is the professor for the course associated to the VM
            if(!professorRepository.existsById(principal)){
                throw new ProfessorNotFoundException("Professor " + principal + " not found");
            }
            if(!professorRepository.getOne(principal).getCourses().contains(vm.getTeam().getCourse())){
                throw new ProfessorNotFoundException("Professor " + principal + " is not a teacher of the course " + vm.getTeam().getCourse().getName());
            }
        }

        // paranoia
        if (!vm.getTeam().getCourse().getEnabled()){
            throw new CourseNotEnabledException("Impossible to use VM of a disabled course");
        }

        // paranoia
        if (vm.getStatus()!=1){
            throw new OffMachineException("This instance is not running");
        }

        return modelMapper.map(imageService.getImage(vm.getImageId()), ImageDTO.class);

    }

    @Override
    public void stopVM(Long vmID){
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();

        if(!vmRepository.existsById(vmID))
            throw new VMInstanceNotFoundException("Instance "+vmID + " not found!");

        VM vm = vmRepository.getOne(vmID);

        if (!vm.getOwners().stream().anyMatch(x->x.getId().equals(principal))){
            throw new TeamAuthorizationException("Current user is not an owner of this machine");
        }

        if (vm.getStatus()==0){
            throw new VMAlreadyInExecutionException("It's not possible to stop a not running machine");
        }

        vm.setStatus(0);
        vmRepository.save(vm);

    }

    @Override
    public void removeVM(Long vmID){
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();

        if(!vmRepository.existsById(vmID))
            throw new VMInstanceNotFoundException("Instance "+vmID + " not found!");

        VM vm = vmRepository.getOne(vmID);

        if (!vm.getOwners().stream().anyMatch(x->x.getId().equals(principal))){
            throw new TeamAuthorizationException("Current user is not an owner of this machine");
        }

        if (vm.getStatus()==1){
            throw new RemoveRunningMachineException("Not possible to remove a running machine: please stop it first");
        }
        vmRepository.delete(vm);

    }

    @Override
    public void shareOwnership(Long vmID,String studentId){
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();

        if(!vmRepository.existsById(vmID))
            throw new VMInstanceNotFoundException("Instance "+vmID + " not found!");

        VM vm = vmRepository.getOne(vmID);

        if (!vm.getOwners().stream().anyMatch(x->x.getId().equals(principal))){
            throw new TeamAuthorizationException("Current user is not an owner of this machine");
        }

        if (!vm.getTeam().getMembers().stream().anyMatch(x->x.getId().equals(studentId))){
            throw new StudentNotFoundException("User "+studentId+ " is not a member of this VM's team");
        }

        if (vm.getOwners().stream().anyMatch(x->x.getId().equals(studentId))){
            throw new TeamAuthorizationException("This user is already an owner for this machine");
        }

        Student s=studentRepository.getOne(studentId);

        vm.addOwner(s);

        vmRepository.save(vm);

    }

    /*****************************************************************************
     *
     ********************* VM INSTANCES: getters  ********************************
     *
     *****************************************************************************/

    @Override
    public VMDTO getVM(Long vmID) {
        if (vmRepository.existsById(vmID))
            throw new VMInstanceNotFoundException("VM "+vmID+ " not found");
        return modelMapper.map(vmRepository.getOne(vmID),VMDTO.class);
    }

    @Override
    public List<VMDTO> getVMByTeam(Long teamID) {
        if (!teamRepository.existsById(teamID))
            throw new TeamNotFoundException("Team "+teamID+ " not found");
        Team t = teamRepository.getOne(teamID);
        return vmRepository.getByTeam(t).stream().map(x->modelMapper.map(x,VMDTO.class))
                .collect(Collectors.toList());
    }
    @Override
    public SettingsDTO getResourcesByTeam(Long teamID){
        if (!teamRepository.existsById(teamID))
            throw new TeamNotFoundException("Team "+teamID+ " not found");
        Team t = teamRepository.getOne(teamID);
        SettingsDTO settings = new SettingsDTO();
        List<VM> vms = vmRepository.getByTeam(t);

        settings.setN_cpu(vms.stream().mapToInt(VM::getN_cpu).sum());

        settings.setDisk_space(vms.stream().mapToInt(VM::getDisk_space).sum());
        settings.setRam(vms.stream().mapToInt(VM::getRam).sum());
        settings.setMax_active(vms.size());
        return settings;
    }

    @Override
    public SettingsDTO getRunningResourcesByTeam(Long teamID){
        if (!teamRepository.existsById(teamID))
            throw new TeamNotFoundException("Team "+teamID+ " not found");
        Team t = teamRepository.getOne(teamID);
        SettingsDTO settings = new SettingsDTO();
        List<VM> vms = vmRepository.getByTeam(t).stream().filter(x->x.getStatus()==1).collect(Collectors.toList());

        settings.setN_cpu(vms.stream().mapToInt(VM::getN_cpu).sum());

        settings.setDisk_space(vms.stream().mapToInt(VM::getDisk_space).sum());
        settings.setRam(vms.stream().mapToInt(VM::getRam).sum());
        settings.setMax_active(vms.size());
        return settings;
    }

    @Override
    public List<VMDTO> getVMs(){
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();

        if (professorRepository.existsById(principal))
            return professorRepository.getOne(principal).getCourses().stream().flatMap(x->x.getTeams().stream())
                .flatMap(x->x.getVMs().stream()).map(x->modelMapper.map(x,VMDTO.class)).collect(Collectors.toList());
        else if (studentRepository.existsById(principal))
            return studentRepository.getOne(principal).getTeams().stream().flatMap(x->x.getVMs().stream()).map(x->modelMapper.map(x,VMDTO.class)).collect(Collectors.toList());
        else
            return vmRepository.findAll().stream().map(x->modelMapper.map(x,VMDTO.class)).collect(Collectors.toList());
    }

    @Override
    public List<VMDTO> getVMsByCourse(String name){
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();

        if (!courseRepository.existsById(name) && !courseRepository.existsByAcronime(name))
            throw new CourseNotFoundException("Course "+name+" not found");

        Course c = courseRepository.getOne(name);

        if (!c.getProfessors().stream().anyMatch(x->x.getId().equals(principal)))
            throw new AuthorizationServiceException("Connected user is not a professor for this course");

        return c.getTeams().stream().flatMap(x->x.getVMs().stream()).map(x->modelMapper.map(x,VMDTO.class)).collect(Collectors.toList());
    }
}
