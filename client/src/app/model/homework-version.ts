export class HomeworkVersion {
    public get deliveryDate(): Date {
        return this._deliveryDate;
    }
    public set deliveryDate(value: Date) {
        this._deliveryDate = value;
    }
    public get content(): any {
        return this._content;
    }
    public set content(value: any) {
        this._content = value;
    }
    public get id() {
        return this._id;
    }
    public set id(value) {
        this._id = value;
    }

    constructor(private _id, private _content: any, private _deliveryDate: Date) {

    }
}
