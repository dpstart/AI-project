export class Image{
    public get picByte(): Uint8Array {
        return this._picByte;
    }
    public set picByte(value: Uint8Array) {
        this._picByte = value;
    }
    public get type(): string {
        return this._type;
    }
    public set type(value: string) {
        this._type = value;
    }



    constructor(private _picByte: Uint8Array,private _type: string){}
}