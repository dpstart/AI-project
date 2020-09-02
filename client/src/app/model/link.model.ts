import { link } from "fs";

export class Link {
    public get href(): string {
        return this._href;
    }
    public set href(value: string) {
        this._href = value;
    }
    public get rel(): string {
        return this._rel;
    }
    public set rel(value: string) {
        this._rel = value;
    }
    constructor(private _href: string, private _rel: string) {
    }

    public equals(obj: Link): boolean {
        return (this.href === obj.href) && (this._rel === obj._rel);
    }
} 