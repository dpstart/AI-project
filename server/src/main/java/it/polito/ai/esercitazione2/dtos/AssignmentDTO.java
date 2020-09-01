package it.polito.ai.esercitazione2.dtos;

import lombok.Data;
import org.springframework.hateoas.RepresentationModel;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.sql.Timestamp;

@Data
public class AssignmentDTO extends RepresentationModel<AssignmentDTO> {

    Integer id;
    @NotNull
    Timestamp releaseDate;
    @NotNull
    Timestamp expirationDate;

}
