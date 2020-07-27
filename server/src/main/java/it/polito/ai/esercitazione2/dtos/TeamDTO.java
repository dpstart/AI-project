package it.polito.ai.esercitazione2.dtos;

import lombok.Data;
import org.springframework.hateoas.RepresentationModel;

import javax.validation.constraints.NotBlank;


@Data
public class TeamDTO extends RepresentationModel<TeamDTO> {

    @NotBlank
    Long id;
    @NotBlank
    String name;
    int status;

    int n_cpu=0;
    long disk_space=0;
    long ram=0;
    int max_active=0;
    int max_available=0;

    String id_creator;

}
