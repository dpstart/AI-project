package it.polito.ai.esercitazione2.dtos;

import lombok.Data;
import org.springframework.hateoas.RepresentationModel;
import javax.validation.constraints.NotBlank;
import java.sql.Timestamp;

@Data
public class AssignmentDTO extends RepresentationModel<AssignmentDTO> {

    @NotBlank
    Integer number;
    @NotBlank
    String course;
    @NotBlank
    Timestamp releaseDate;
    @NotBlank
    Timestamp expirationDate;

}
