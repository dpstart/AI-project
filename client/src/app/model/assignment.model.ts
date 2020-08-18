/*    Integer id;
    @NotBlank
    Timestamp releaseDate;
    @NotBlank
    Timestamp expirationDate;
    
*/


export class Assignment {

    public get id(): number {
        return this._id;
    }
    public set id(value: number) {
        this._id = value;
    }

    constructor(private _id: number, private _releaseDate: string, private expirationDate: string) {

    }


}