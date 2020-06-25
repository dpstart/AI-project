package it.polito.ai.esercitazione2.dtos;

import lombok.Data;
import org.springframework.hateoas.RepresentationModel;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;

@Data
public class CourseDTO extends RepresentationModel<CourseDTO> {

    @NotBlank
    String name;
    @Min(1)
    int min=1;
    int max=50;
    Boolean enabled;

}
