import { Injectable } from '@angular/core';
import { Observable, throwError, Subject, ReplaySubject } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Student } from '../model/student.model';
import { Team } from '../model/team.model';
import { catchError } from 'rxjs/operators';



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

    constructor(private http: HttpClient) { }

    URL = "http://localhost:4200/API"

    selectedCourse: string;

    setCourse(course) {
        this.selectedCourse = course;
    }

    getSelectedCourse() {
        return this.selectedCourse;
    }

    getCourses<T>(): Observable<T> {

        const url = `${this.URL}/courses`;
        return this.http.get<T>(url);
    }

    getCourse<T>(name: string): Observable<T> {

        const url = `${this.URL}/courses/${name}`;
        return this.http.get<T>(url);
    }

    getTeams<Team>(course: string): Observable<Team[]> {

        const url = `${this.URL}/courses/${course}/teams`;
        return this.http.get<Team[]>(url);

    }

    getVMs<T>(team: number): Observable<T> {

        const url = `${this.URL}/vms/${team}`;
        return this.http.get<T>(url);

    }
}
