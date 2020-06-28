package it.polito.ai.esercitazione2.dtos;

import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
public class SettingsDTO {

    @NotNull
    Integer n_cpu;
    @NotNull
    Long disk_space;
    Long ram;
    @NotNull
    Integer max_active; //contemporary active
    @NotNull
    Integer max_available; //active + off
}

