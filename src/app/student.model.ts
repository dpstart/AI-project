export class Student {

    id: string;
    name: string;
    firstName: string;
    courseId: number;

    constructor(id: string, name: string, firstName: string) {
        this.id = id;
        this.name = name;
        this.firstName = firstName;
        this.courseId = 0;
    }
}