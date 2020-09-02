import { Link } from './link.model';

export class HomeworkVersion {
    public get links(): Link[] {
        return this._links;
    }
    public set links(value: Link[]) {
        this._links = value;
    }
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
    public get id(): number {
        return this._id;
    }
    public set id(value: number) {
        this._id = value;
    }

    constructor(private _id: number, private _content: any, private _deliveryDate: Date,private _links: Link[] = []) {
    }

   

}
