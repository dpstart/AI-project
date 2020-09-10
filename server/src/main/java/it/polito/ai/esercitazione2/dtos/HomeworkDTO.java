package it.polito.ai.esercitazione2.dtos;

import it.polito.ai.esercitazione2.entities.Homework;
import lombok.Data;
import org.springframework.hateoas.RepresentationModel;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.sql.Timestamp;

@Data
public class HomeworkDTO extends RepresentationModel<HomeworkDTO> {

    Long id;
    @NotNull
    Homework.states state;
    @NotNull
    Boolean isFinal;
    @NotNull
    Float mark;
    Timestamp lastModified;

}
