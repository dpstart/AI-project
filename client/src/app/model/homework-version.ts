export class HomeworkVersion {
    public get deliveryDate(): Date {
        return this._deliveryDate;
    }
    public set deliveryDate(value: Date) {
        this._deliveryDate = value;
    }
    public get image(): any {
        return this._image;
    }
    public set image(value: any) {
        this._image = value;
    }
    public get id() {
        return this._id;
    }
    public set id(value) {
        this._id = value;
    }

    constructor(private _id, private _image: any, private _deliveryDate: Date) {

    }
}
