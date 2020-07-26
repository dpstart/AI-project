

export class Homework {

    // Integer id;
    // @NotBlank
    // Homework.states state;
    // @NotBlank
    // Boolean isFinal;
    // @NotBlank
    // Float mark;

    constructor(private id: number, private state: states, private isFinal: Boolean, private mark: Number) { }
}

export enum states {
    unread,
    read,
    delivered,
    reviewed
}

