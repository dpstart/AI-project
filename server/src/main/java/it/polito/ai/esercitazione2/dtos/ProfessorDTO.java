package it.polito.ai.esercitazione2.dtos;


import com.fasterxml.jackson.annotation.JsonProperty;
import com.opencsv.bean.CsvBindByName;
import lombok.Data;
import org.springframework.hateoas.RepresentationModel;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;


@Data
public class ProfessorDTO extends RepresentationModel<ProfessorDTO> {

    @NotBlank
    String id;
    @NotBlank
    String name;
    @NotBlank
    String firstName;
    @Email(regexp="^((d[0-9]{6})|([a-z]+\\.[a-z]+))(@polito.it)$")
    @NotBlank
    String email;
    @Size(min=8, max = 12)
    @CsvBindByName
    @NotBlank
    @JsonProperty("password")
    String password;
    Boolean enabled=false;


}
