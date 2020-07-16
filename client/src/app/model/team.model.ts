export class Team {

    id: number
    name: string
    status: number
    disk_space: number
    max_active: number
    max_available: number
    n_cpu: number
    ram: number
    vmmodel_name: string


    constructor(
        id: number,
        name: string,
        status: number,
        disk_space: number,
        max_active: number,
        max_available: number,
        n_cpu: number,
        ram: number,
        vmmodel_name: string) {

        this.id = id;
        this.name = name;
        this.status = status;
        this.disk_space = disk_space;
        this.max_active = max_active;
        this.max_available = max_available;
        this.n_cpu = n_cpu;
        this.ram = ram;
        this.vmmodel_name = vmmodel_name;
    }
}