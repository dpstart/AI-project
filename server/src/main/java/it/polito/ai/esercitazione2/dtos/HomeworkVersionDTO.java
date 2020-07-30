package it.polito.ai.esercitazione2.dtos;

import it.polito.ai.esercitazione2.entities.Image;
import lombok.Data;
import org.springframework.hateoas.RepresentationModel;

import java.sql.Timestamp;

@Data
public class HomeworkVersionDTO extends RepresentationModel<HomeworkDTO> {

    Integer id;
    Image content;
    Timestamp deliveryDate;

}