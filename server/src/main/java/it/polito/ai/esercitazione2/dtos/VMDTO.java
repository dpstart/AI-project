package it.polito.ai.esercitazione2.dtos;

import lombok.Data;
import org.springframework.hateoas.RepresentationModel;

import javax.persistence.Id;

@Data
public class VMDTO extends RepresentationModel<VMDTO> {


    Long id;
    int n_cpu;
    int disk_space;
    int ram;
    int status;

    String id_creator;
}
