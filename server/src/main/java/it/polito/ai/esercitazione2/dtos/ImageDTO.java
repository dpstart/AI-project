package it.polito.ai.esercitazione2.dtos;

import lombok.Data;
import org.springframework.hateoas.RepresentationModel;

@Data
public class ImageDTO extends RepresentationModel<ImageDTO> {

    private Long id;

    private String type;

    private byte[] picByte;

}
