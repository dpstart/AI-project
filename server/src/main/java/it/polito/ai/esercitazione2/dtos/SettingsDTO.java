package it.polito.ai.esercitazione2.dtos;

import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
public class SettingsDTO {

    @NotNull
    int n_cpu;
    @NotNull
    long disk_space;
    long ram;
    @NotNull
    int max_active; //contemporary active
    @NotNull
    int max_available; //active + off
}

