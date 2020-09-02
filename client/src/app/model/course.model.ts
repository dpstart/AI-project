
// @NotBlank
// String name;
// @NotBlank
// String acronime;
// @Min(1)
// int min=1;
// int max=50;
// Boolean enabled;

import { Link } from './link.model';



export class Course {
    public get links(): Link[] {
        return this._links;
    }
    public set links(value: Link[]) {
        this._links = value;
    }
    public get max(): Number {
        return this._max;
    }
    public set max(value: Number) {
        this._max = value;
    }
    public get min(): Number {
        return this._min;
    }
    public set min(value: Number) {
        this._min = value;
    }
    public get acronime(): string {
        return this._acronime;
    }
    public set acronime(value: string) {
        this._acronime = value;
    }
    public get name(): string {
        return this._name;
    }
    public set name(value: string) {
        this._name = value;
    }

    // Integer id;
    // @NotBlank
    // Homework.states state;
    // @NotBlank
    // Boolean isFinal;
    // @NotBlank
    // Float mark;

    constructor(private _name: string, private _acronime: string, private _min: Number,  private _links: Link[] = [],private _max: Number) { }



    // getHrefByRel(rel: string): string {

    //     let href = "";

    //     if (this._links.some(link => {
    //         if (link.rel == rel)
    //             href = link.href
    //     }))
    //         return href;
    // }

}


