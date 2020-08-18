import { Injectable, OnInit } from '@angular/core';
import { Observable, throwError, Subject, ReplaySubject } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';


export interface NavTeacherLinks {
    link: String;
    label: String;
}

@Injectable({
    providedIn: 'root'
})
export class TeacherService {
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
            'Something bad happened; please try again later.');
    };


    //tabs of the teacher
    private navTeacherLinks: NavTeacherLinks[];

    constructor(private http: HttpClient) {

        this.navTeacherLinks = [{ link: 'students', label: 'Students' }, { link: 'vms', label: 'VMs' }, { link: 'homework', label: 'Consegne ed Elaborati' }]
    }

    getNavTeacherLinks() {
        return this.navTeacherLinks
    }

    URL = "http://localhost:4200/API"

    selectedCourse: string;


    setSelectedCourse(course) {
        this.selectedCourse = course;
    }

    getSelectedCourse() {
        if (this.selectedCourse)
            return this.selectedCourse;
    }

    getCourses<Course>(): Observable<Course[]> {

        const url = `${this.URL}/courses`;
        return this.http.get<Course[]>(url);
    }

    getCourse<Course>(name: string): Observable<Course> {

        const url = `${this.URL}/courses/${name}`;
        return this.http.get<Course>(url);
    }

    getTeams<Team>(course: string): Observable<Team[]> {

        const url = `${this.URL}/courses/${course}/teams`;
        return this.http.get<Team[]>(url);

    }

    getVMs<T>(team: number): Observable<T> {

        const url = `${this.URL}/vms/teams/${team}`;
        return this.http.get<T>(url);

    }

    getHomeworks<Homework>(courseName: string): Observable<Homework[]> {
        const url = `${this.URL}/courses/${courseName}/homeworks`;
        return this.http.get<Homework[]>(url);
    }


    getHomeworksByAssignment<Homework>(courseName: string, assignmentId: number): Observable<Homework[]> {
        const url = `${this.URL}/courses/${courseName}/assignments/${assignmentId}/homeworks`;
        return this.http.get<Homework[]>(url);

    }

    getAssignmentsByCourse<Assignment>(courseName: string): Observable<Assignment[]> {
        const url = `${this.URL}/courses/${courseName}/assignments`;
        return this.http.get<Assignment[]>(url);

    }



}
