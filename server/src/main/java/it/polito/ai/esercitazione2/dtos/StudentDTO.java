package it.polito.ai.esercitazione2.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.opencsv.bean.CsvBindByName;
import lombok.Data;
import org.springframework.hateoas.RepresentationModel;
import org.springframework.web.multipart.MultipartFile;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;


@Data
public class StudentDTO extends RepresentationModel<StudentDTO> {
    @CsvBindByName
    @NotBlank
    @JsonProperty("id")
    String id;
    @CsvBindByName
    @NotBlank
    @JsonProperty("name")
    String name;
    @CsvBindByName
    @NotBlank
    @JsonProperty("firstName")
    String firstName;

    @Size(min=8, max = 12)
    @CsvBindByName
    @NotBlank
    @JsonProperty("password")
    String password;

    @CsvBindByName
    @JsonProperty("email")
    @Email(regexp="((s[0-9]{6})|([a-z]+\\.[a-z]+))@studenti.polito.it")
    String email;

    Boolean enabled=false;




}
