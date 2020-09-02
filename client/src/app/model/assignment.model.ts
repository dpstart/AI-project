/*    Integer id;
    @NotBlank
    Timestamp releaseDate;
    @NotBlank
    Timestamp expirationDate;
    
*/

import { Link } from './link.model';


export class Assignment {
    public get links(): Link[] {
        return this._links;
    }
    public set links(value: Link[]) {
        this._links = value;
    }
    public get expirationDate(): string {
        return this._expirationDate;
    }
    public set expirationDate(value: string) {
        this._expirationDate = value;
    }
    public get releaseDate(): string {
        return this._releaseDate;
    }
    public set releaseDate(value: string) {
        this._releaseDate = value;
    }

    public get id(): number {
        return this._id;
    }
    public set id(value: number) {
        this._id = value;
    }

    constructor(private _id: number, private _releaseDate: string, private _expirationDate: string, private _links: Link[] = []) {

    }




}