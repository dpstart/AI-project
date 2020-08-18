

export class Homework {
    public get mark(): Number {
        return this._mark;
    }
    public set mark(value: Number) {
        this._mark = value;
    }
    public get isFinal(): Boolean {
        return this._isFinal;
    }
    public set isFinal(value: Boolean) {
        this._isFinal = value;
    }
    public get state(): states {
        return this._state;
    }
    public set state(value: states) {
        this._state = value;
    }
    public get id(): number {
        return this._id;
    }
    public set id(value: number) {
        this._id = value;
    }

    // Integer id;
    // @NotBlank
    // Homework.states state;
    // @NotBlank
    // Boolean isFinal;
    // @NotBlank
    // Float mark;

    constructor(private _id: number, private _state: states, private _isFinal: Boolean, private _mark: Number) { }
}

export enum states {
    unread,
    read,
    delivered,
    reviewed
}

