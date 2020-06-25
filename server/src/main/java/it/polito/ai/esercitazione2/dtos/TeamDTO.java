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

}
