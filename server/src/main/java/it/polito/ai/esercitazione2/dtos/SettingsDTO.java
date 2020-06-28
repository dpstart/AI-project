package it.polito.ai.esercitazione2.dtos;

import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
public class SettingsDTO {

    @NotNull
    Integer n_cpu=0;
    @NotNull
    Integer disk_space= 0;
    @NotNull
    Integer ram=0;

    Integer max_active=0; //contemporary active

    Integer max_available=0; //active + off
}

