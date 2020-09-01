package it.polito.ai.esercitazione2.dtos;

import it.polito.ai.esercitazione2.entities.Homework;
import lombok.Data;
import org.springframework.hateoas.RepresentationModel;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;

@Data
public class HomeworkDTO extends RepresentationModel<HomeworkDTO> {

    Long id;
    @NotBlank
    Homework.states state;
    @NotBlank
    Boolean isFinal;
    @NotBlank
    Float mark;

}
