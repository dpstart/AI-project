import { Link } from './link.model';

export class Team {
    public get links(): Link[] {
        return this._links;
    }
    public set links(value: Link[]) {
        this._links = value;
    }
    public get vmmodel_name(): string {
        return this._vmmodel_name;
    }
    public set vmmodel_name(value: string) {
        this._vmmodel_name = value;
    }
    public get ram(): number {
        return this._ram;
    }
    public set ram(value: number) {
        this._ram = value;
    }
    public get n_cpu(): number {
        return this._n_cpu;
    }
    public set n_cpu(value: number) {
        this._n_cpu = value;
    }
    public get max_available(): number {
        return this._max_available;
    }
    public set max_available(value: number) {
        this._max_available = value;
    }
    public get max_active(): number {
        return this._max_active;
    }
    public set max_active(value: number) {
        this._max_active = value;
    }
    public get disk_space(): number {
        return this._disk_space;
    }
    public set disk_space(value: number) {
        this._disk_space = value;
    }
    public get status(): number {
        return this._status;
    }
    public set status(value: number) {
        this._status = value;
    }
    public get name(): string {
        return this._name;
    }
    public set name(value: string) {
        this._name = value;
    }
    public get id(): number {
        return this._id;
    }
    public set id(value: number) {
        this._id = value;
    }




    constructor(
        private _id: number,
        private _name: string,
        private _status: number,
        private _disk_space: number,
        private _max_active: number,
        private _max_available: number,
        private _n_cpu: number,
        private _ram: number,
        private _vmmodel_name: string,
        private _links: Link[] = [],) {


    }
}