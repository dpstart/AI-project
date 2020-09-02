import { Link } from './link.model';


export class Homework {
    public get links(): Link[] {
        return this._links;
    }
    public set links(value: Link[]) {
        this._links = value;
    }
    public get mark(): number {
        return this._mark;
    }
    public set mark(value: number) {
        this._mark = value;
    }
    public get isFinal(): boolean {
        return this._isFinal;
    }
    public set isFinal(value: boolean) {
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

    constructor(private _id: number, private _state: states, private _isFinal: boolean, private _mark: number,private _links: Link[] = [],) { }


    

}

export enum states {
    unread,
    read,
    delivered,
    reviewed
}

