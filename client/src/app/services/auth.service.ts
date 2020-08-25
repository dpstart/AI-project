import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import * as moment from 'moment';
import { RouteStateService } from './route-state.service';
import { throwError } from 'rxjs/internal/observable/throwError';
import { catchError, retry } from 'rxjs/operators';

export enum ROLE {
  TEACHER,
  STUDENT
}

export interface RegisteredUser {
  first_name: string
  last_name: string
  id: string
  email: string
  password: string
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.ù
      console.log(error)
      console.error('An error occurred:', error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error.message}`);
    }
    // return an observable with a user-facing error message
    return throwError({ status: error.status, message: error.error.message });
  };


  URL = "http://localhost:8080"
  constructor(private http: HttpClient, private routeStateService: RouteStateService) { }

  login(email: string, password: string) {
    const url = `${this.URL}/authenticate`;
    return this.http.post<string>(url, { username: email, password: password });
  }

  register(user: RegisteredUser) {
    const url = `${this.URL}/API/students`;

    let headers = new HttpHeaders()
    headers.append('Content-Type', 'multipart/form-data; boundary=Inflow');


    return this.http.post<string>(url, user, { "headers": headers }).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

  logout() {
    localStorage.removeItem('session');
    this.routeStateService.updatePathParamState("Home")
  }

  getAccessToken() {

    var session = localStorage.getItem('session');
    if (session === null) return;

    session = JSON.parse(session);
    return session["token"];
  }

  getRole() {

    if (localStorage.getItem('session') === null) return null;
    let session = JSON.parse(localStorage.getItem('session'));
    let role = session["info"]["AUTHORITIES"];


    if (role == "ROLE_PROFESSOR")
      return ROLE.TEACHER
    return ROLE.STUDENT


  }

  getEmail() {
    let session = JSON.parse(localStorage.getItem('session'));
    return session['email']
  }

  isRoleStudent() {
    return this.getRole() == ROLE.STUDENT
  }

  isRoleTeacher() {
    return this.getRole() == ROLE.TEACHER;
  }

  isLoggedIn() {

    if (localStorage.getItem('session') === null) return false;

    let session = JSON.parse(localStorage.getItem('session'));
    let isNotExpired = session["info"]["exp"] > moment().unix();
    return isNotExpired;
  }
}
