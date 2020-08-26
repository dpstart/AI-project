import { Injectable, OnInit } from '@angular/core';
import { Observable, throwError, Subject, ReplaySubject } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HomeworkVersion } from '../model/homework-version';
import { retry, catchError } from 'rxjs/operators';


export interface NavTeacherLinks {
    link: String;
    label: String;
}

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

        this.navTeacherLinks = [{ link: 'students', label: 'Students' }, { link: 'vms', label: 'VMs' }, { link: 'homework', label: 'Consegne ed Elaborati' }]
    }

    getNavTeacherLinks() {
        return this.navTeacherLinks
    }

    getCourses<Course>(): Observable<Course[]> {

        const url = `${this.URL}/courses`;
        return this.http.get<Course[]>(url).pipe(
            retry(3),
            catchError(this.handleError)
        );
    }

    getCourse<Course>(name: string): Observable<Course> {

        const url = `${this.URL}/courses/${name}`;
        return this.http.get<Course>(url).pipe(
            retry(3),
            catchError(this.handleError)
        );
    }

    getTeams<Team>(course: string): Observable<Team[]> {

        const url = `${this.URL}/courses/${course}/teams`;
        return this.http.get<Team[]>(url).pipe(
            retry(3),
            catchError(this.handleError)
        );

    }

    getVmsForTeam<T>(team: number): Observable<T> {

        const url = `${this.URL}/vms/teams/${team}`;
        return this.http.get<T>(url).pipe(
            retry(3),
            catchError(this.handleError)
        );

    }

    getHomeworks<Homework>(courseName: string): Observable<Homework[]> {
        const url = `${this.URL}/courses/${courseName}/homeworks`;
        return this.http.get<Homework[]>(url).pipe(
            retry(3),
            catchError(this.handleError)
        );
    }

    getHomeworksByAssignment<Homework>(courseName: string, assignmentId: number): Observable<Homework[]> {
        const url = `${this.URL}/courses/${courseName}/assignments/${assignmentId}/homeworks`;
        return this.http.get<Homework[]>(url).pipe(
            retry(3),
            catchError(this.handleError)
        );
    }


    getHomeworkVersions(courseName: string, assignmentId: number, homeworkId: number): Observable<HomeworkVersion[]> {
        const url = `${this.URL}/courses/${courseName}/assignments/${assignmentId}/homeworks/${homeworkId}/versions`;
        return this.http.get<HomeworkVersion[]>(url).pipe(
            retry(3),
            catchError(this.handleError)
        );
    }


    getAssignmentsByCourse<Assignment>(courseName: string): Observable<Assignment[]> {
        const url = `${this.URL}/courses/${courseName}/assignments`;
        return this.http.get<Assignment[]>(url).pipe(
            retry(3),
            catchError(this.handleError)
        );

    }

    changeTeamSettings(courseName: string, teamId: number, settings: TeamSettings) {
        const url = `${this.URL}/courses/${courseName}/teams/${teamId}/settings`;

        console.log(settings)
        return this.http.post(url, settings).pipe(
            retry(3),
            catchError(this.handleError)
        );
    }

    private handleError(error: HttpErrorResponse) {
        if (error.error instanceof ErrorEvent) {
            // A client-side or network error occurred. Handle it accordingly.
            console.error('An error occurred:', error.error.message);
        } else {
            // The backend returned an unsuccessful response code.
            // The response body may contain clues as to what went wrong,
            console.error(
                `Backend returned code ${error.status}, ` +
                `body was: ${error.error}`);
        }
        // return an observable with a user-facing error message
        return throwError(
            { status: error.status, message: error.error.message });
    };



}
