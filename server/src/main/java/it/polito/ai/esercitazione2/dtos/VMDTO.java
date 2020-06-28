package it.polito.ai.esercitazione2.dtos;

import lombok.Data;

import javax.persistence.Id;

@Data
public class VMDTO {


    Long id;
    int n_cpu;
    int disk_space;
    int ram;
    int status;
}
