package it.polito.ai.esercitazione2.dtos;


import com.fasterxml.jackson.annotation.JsonProperty;
import com.opencsv.bean.CsvBindByName;
import lombok.Data;
import org.springframework.hateoas.RepresentationModel;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;


@Data
public class ProfessorDTO extends RepresentationModel<ProfessorDTO> {

    @NotBlank
    String id;
    @Pattern(regexp = "^[a-zA-Z]+$")
    @NotBlank
    String name;
    @Pattern(regexp = "^[a-zA-Z]+$")
    @NotBlank
    String firstName;

    String alias=null;

    String email=null;

    @Size(min=8, max = 12)
    @CsvBindByName
    @NotBlank
    @JsonProperty("password")
    String password;

    Boolean enabled=false;


}
