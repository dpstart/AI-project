package it.polito.ai.esercitazione2.dtos;

import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
public class SettingsDTO {

    @NotNull
    Integer n_cpu=0;
    @NotNull
    Long disk_space= Long.valueOf(0);
    Long ram=Long.valueOf(0);
    @NotNull
    Integer max_active=0; //contemporary active
    @NotNull
    Integer max_available=0; //active + off
}

