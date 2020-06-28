package it.polito.ai.esercitazione2.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.opencsv.bean.CsvBindByName;
import lombok.Data;
import org.springframework.hateoas.RepresentationModel;
import org.springframework.web.multipart.MultipartFile;

import javax.validation.constraints.NotBlank;


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




}
