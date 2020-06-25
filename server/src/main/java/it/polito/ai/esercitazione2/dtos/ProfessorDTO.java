package it.polito.ai.esercitazione2.dtos;


import lombok.Data;
import org.springframework.hateoas.RepresentationModel;

import javax.validation.constraints.NotBlank;


@Data
public class ProfessorDTO extends RepresentationModel<ProfessorDTO> {

    @NotBlank
    String id;
    @NotBlank
    String name;
    @NotBlank
    String firstName;

}
