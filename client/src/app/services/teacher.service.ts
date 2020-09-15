import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HomeworkVersion } from '../model/homework-version';
import { retry, catchError } from 'rxjs/operators';
import { Student } from '../model/student.model';
import { Assignment } from '../model/assignment.model';
import { Homework } from '../model/homework.model';
import { Course } from '../model/course.model';

// Interfaccia link del teacher
export interface NavTeacherLinks {
    link: String;
    label: String;
}

// Intefaccia usata per il passaggio dati form
export interface TeamSettings {
    nCpu: number
    diskSpace: number
    ram: number
    max_active: number
    max_available: number
}

@Injectable({
    providedIn: 'root'
})
export class TeacherService {

    //tabs of the teacher 
    private navTeacherLinks: NavTeacherLinks[];

    URL = "http://localhost:4200/API"

    constructor(private http: HttpClient) {

        // Link del prof
        this.navTeacherLinks = [
            { link: 'students', label: 'Students' },
            { link: 'vms', label: 'VMs' },
            { link: 'homework', label: 'Consegne ed Elaborati' }
        ]
    }


    //************************************ RESEARCH *****************************************//


    // Ritorna i link del professore
    getNavTeacherLinks() {
        return this.navTeacherLinks
    }


    /**Metodo generico che richiede una determinata risorsa, 
     * usato quando risulta necessario prendere risorse raggiungibili con link
     * passati con entità */
    getResourceByUrl(href: string): Observable<any> {
        return this.http.get<any>(href).pipe(
            retry(3),
            catchError(this.handleError)
        );
    }

    /**
     * Metodo che ritorna lo studente dato il suo id
     * @param id: id studente
     */
    getStudentById(id: string): Observable<Student> {

        const url = `${this.URL}/students/${id}`
        return this.http.get<Student>(url).pipe(
            retry(3),
            catchError(this.handleError)
        );
    }

    /**
     * Metodo che ritorna lo student id dato l'id dell'hw
     * @param courseName nome corso
     * @param assignmentId id assignment 
     * @param homeworkId  id hw
     */
    getStudentIdByHomework(courseName: string, assignmentId: number, homeworkId: number): Observable<string> {
        const url = `${this.URL}/courses/${courseName}/assignments/${assignmentId}/homeworks/${homeworkId}/studentId`;
        return this.http.get<string>(url).pipe(
            retry(3),
            catchError(this.handleError)
        );
    }

    /**
     * Metodo che ritorna tutti i corsi del professore 
     */
    getCourses<Course>(): Observable<Course[]> {

        const url = `${this.URL}/professors/allCourses`;
        return this.http.get<Course[]>(url).pipe(
            retry(3),
            catchError(this.handleError)
        );
    }

    /**
     * Metodo che ritorna il corso dato il nome
     * @param name 
     */
    getCourse<Course>(name: string): Observable<Course> {

        const url = `${this.URL}/courses/${name}`;
        return this.http.get<Course>(url).pipe(
            retry(3),
            catchError(this.handleError)
        );
    }

    /**
     * Metodo che ritorna i team di un determinato corso
     * @param course 
     */
    getTeams<Team>(course: string): Observable<Team[]> {

        const url = `${this.URL}/courses/${course}/teams`;
        return this.http.get<Team[]>(url).pipe(
            retry(3),
            catchError(this.handleError)
        );
    }

    /**
     * Metodo che ritorna le vms di un determinato team
     * @param team 
     */
    getVmsForTeam<T>(team: number): Observable<T> {

        const url = `${this.URL}/vms/teams/${team}`;
        return this.http.get<T>(url).pipe(
            retry(3),
            catchError(this.handleError)
        );
    }

    /**
     * Metodo che ritorna gli hws assegnati ad un derminato corso
     * @param courseName 
     */
    getHomeworks<Homework>(courseName: string): Observable<Homework[]> {
        const url = `${this.URL}/courses/${courseName}/homeworks`;
        return this.http.get<Homework[]>(url).pipe(
            retry(3),
            catchError(this.handleError)
        );
    }

    /**
     * Metodo che ritorna gli hws assegnati per un determinato assignment
     * @param courseName nome del corso in cui l'assignement è stato assegnato
     * @param assignmentId assignment id
     */
    getHomeworksByAssignment<Homework>(courseName: string, assignmentId: number): Observable<Homework[]> {
        const url = `${this.URL}/courses/${courseName}/assignments/${assignmentId}/homeworks`;
        return this.http.get<Homework[]>(url).pipe(
            retry(3),
            catchError(this.handleError)
        );
    }

    /**
     * Metodo che ritira lo storico (hw Versions) di un determinato hw relativo ad un determinato corso e assisgnemt
     * @param courseName 
     * @param assignmentId 
     * @param homeworkId 
     */
    getHomeworkVersions(courseName: string, assignmentId: number, homeworkId: number): Observable<HomeworkVersion[]> {
        const url = `${this.URL}/courses/${courseName}/assignments/${assignmentId}/homeworks/${homeworkId}/versions`;
        return this.http.get<HomeworkVersion[]>(url).pipe(
            retry(3),
            catchError(this.handleError)
        );
    }

    /**
     * Metodo che ritira assignments di un determinato corso
     * @param courseName 
     */
    getAssignmentsByCourse<Assignment>(courseName: string): Observable<Assignment[]> {
        const url = `${this.URL}/courses/${courseName}/assignments`;
        return this.http.get<Assignment[]>(url).pipe(
            retry(3),
            catchError(this.handleError)
        );
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //***********************************************CREATE******************************************************//


    /**
     * Metodo che effettua una post per poter aggiungere un assignment e ritorna l'assignment corrispondente
     * @param courseName 
     * @param formData 
     */
    addAssignment(courseName: string, formData: FormData): Observable<Assignment> {
        const url = `${this.URL}/courses/${courseName}/assignments/`
        return this.http.post<Assignment>(url, formData).pipe(
            retry(3),
            catchError(this.handleError)
        );

    }


    /**
     * Metodo che effettua una post per dare la possibilità al professore di aggiungere una review ad un hw
     * Nel form data è possibile inserire un campo immagine e/o un campo voto
     * 
     * L'immagine corrispondente a homeworVersion
     * e un homework nel caso in cui il voto sia definitivo
     * form.append('homeworkVersion', this.selectedFile, this.selectedFile.name);
     * form.append('homework', new Blob([JSON.stringify(homework)], { type: "application/json" }));
     * 
     * @param courseName 
     * @param assignmentId 
     * @param homeworkId 
     * @param form 
     */
    reviewHomework(courseName: string, assignmentId: number, homeworkId: number, form: FormData): Observable<Homework> {
        const url = `${this.URL}/courses/${courseName}/assignments/${assignmentId}/homeworks/${homeworkId}`
        return this.http.post<Homework>(url, form).pipe(
            retry(3),
            catchError(this.handleError)
        );
    }

    /**
     * Metodo che crea un corso passato come parametro tramite una post
     * @param course 
     */
    createCourse(course: Course) {
        const url = `${this.URL}/courses/`
        return this.http.post<Course>(url, course).pipe(
            retry(3),
            catchError(this.handleError)
        );

    }


    /**
     * Metodo che cambia i settings per un detrerminato team. 
     * @param courseName 
     * @param teamId 
     * @param settings 
     * 
      interface TeamSettings {
            nCpu: number
            diskSpace: number
            ram: number
            max_active: number
            max_available: number
        }
     */
    changeTeamSettings(courseName: string, teamId: number, settings: TeamSettings) {
        const url = `${this.URL}/courses/${courseName}/teams/${teamId}/settings`;
        return this.http.post(url, settings).pipe(
            retry(3),
            catchError(this.handleError)
        );
    }
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //****************************************** DELETE *********************************************************//


    removeAssignment(courseName: string, id: number): Observable<any> {
        const url = `${this.URL}/courses/${courseName}/assignments/${id}`
        return this.http.delete(url).pipe(
            retry(3),
            catchError(this.handleError)
        );
    }

    private handleError(error: HttpErrorResponse) {
        if (error.error instanceof ErrorEvent) {
            // A client-side or network error occurred. Handle it accordingly.
            console.error('An error occurred:', error.message);
        } else {
            // The backend returned an unsuccessful response code.
            // The response body may contain clues as to what went wrong,
            console.error(
                `Backend returned code ${error.status}, ` +
                `body was: ${error.message}`);
        }
        // return an observable with a user-facing error message

        console.log(error)
        return throwError(
            { status: error.status, message: error.error.message });
    };



}
