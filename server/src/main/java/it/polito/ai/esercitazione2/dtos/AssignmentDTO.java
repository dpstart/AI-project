package it.polito.ai.esercitazione2.dtos;

import lombok.Data;
import org.springframework.hateoas.RepresentationModel;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import java.sql.Timestamp;

@Data
public class AssignmentDTO extends RepresentationModel<AssignmentDTO> {

    @NotBlank
    Integer number;
    @Valid
    CourseDTO course;
    @Valid
    ProfessorDTO professor;
    @NotBlank
    Timestamp releaseDate;
    @NotBlank
    Timestamp expirationDate;

}
