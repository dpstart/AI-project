package it.polito.ai.esercitazione2.dtos;


import lombok.Data;
import org.springframework.hateoas.RepresentationModel;

@Data
public class VMModelDTO extends RepresentationModel<VMModelDTO> {

    String name;
}
