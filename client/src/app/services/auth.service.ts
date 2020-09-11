import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';

import * as moment from 'moment';
import { RouteStateService } from './route-state.service';
import { throwError } from 'rxjs/internal/observable/throwError';
import { catchError, retry } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { Image } from '../model/image.model';

export enum ROLE {
  TEACHER,
  STUDENT
}

export interface RegisteredUser {
  id: string
  name: string
  firstName: string
  password: string
  email: string
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {


  private _subjectNameAndSurname: Subject<string>;

  private _subjectProfileImage: Subject<Image>;


  public get subjectNameAndSurname(): Subject<string> {
    return this._subjectNameAndSurname;
  }
  public set subjectNameAndSurname(value: Subject<string>) {
    this._subjectNameAndSurname = value;
  }

  private _observableProfileImage: Observable<Image>;

  public get observableProfileImage(): Observable<Image> {
    return this._observableProfileImage;
  }
  public set observableProfileImage(value: Observable<Image>) {
    this._observableProfileImage = value;
  }



  private _observableNameAndSurname: Observable<string>;


  public get observableNameAndSurname(): Observable<string> {
    return this._observableNameAndSurname;
  }
  public set observableNameAndSurname(value: Observable<string>) {
    this._observableNameAndSurname = value;
  }


  public get subjectProfileImage(): Subject<Image> {
    return this._subjectProfileImage;
  }
  public set subjectProfileImage(value: Subject<Image>) {
    this._subjectProfileImage = value;
  }

  UrlLogin = "http://localhost:8080"

  URL = "http://localhost:4200/API"

  constructor(private http: HttpClient, private routeStateService: RouteStateService) {

    this.subjectNameAndSurname = new Subject<string>()
    this.observableNameAndSurname = this.subjectNameAndSurname.asObservable()
    this.subjectProfileImage = new Subject<Image>()
    this.observableProfileImage = this.subjectProfileImage.asObservable()
  }

  login(email: string, password: string) {
    const url = `${this.URL}/authenticate`;
    return this.http.post<string>(url, { username: email, password: password }).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

  register(user: RegisteredUser, file: File): Observable<RegisteredUser> {

    const formData = new FormData();

    let headers = new HttpHeaders()
    headers.set('Content-Type', 'multipart/form-data;');


    // Il tentativo di discernere la fine della mail non è un aggiunta di un livello di sicurezza ma serve solo a discernere quale API contattare
    if (user.email.includes("@studenti.polito.it")) {

      let url = `${this.URL}/students`;

      formData.append('student', new Blob([JSON.stringify(user)], {
        type: "application/json"
      }))

      formData.append('image', file, file.name);


      return this.http.post<RegisteredUser>(url, formData, { "headers": headers }).pipe(
        retry(3),
        catchError(this.handleError)
      );
    } else {
      if (!user.email.includes("@docenti.polito.it")) {
        throwError("Wrong Format")
      }
      let url = `${this.URL}/professors`;

      formData.append('professor', new Blob([JSON.stringify(user)], {
        type: "application/json"
      }))
      return this.http.post<RegisteredUser>(url, formData, { "headers": headers }).pipe(
        retry(3),
        catchError(this.handleError)
      );
    }
  }

  logout() {
    localStorage.removeItem('session');
    this.routeStateService.updatePathParamState("Home")
  }


  getSelf(): Observable<any> {

    let url = "";
    //TODO admin??
    if (this.isRoleTeacher()) {

      url = `${this.URL}/professors/self`;

    } else {
      url = `${this.URL}/students/self`;
    }

    return this.http.get<any>(url).pipe(
      retry(3),
      catchError(this.handleError)
    )
  }



  getImage(): Observable<Image> {

    let url = "";
    //TODO admin??
    if (this.isRoleTeacher()) {

      url = `${this.URL}/professors/image`;

    } else {
      url = `${this.URL}/students/image`;
    }

    return this.http.get<Image>(url).pipe(
      retry(3),
      catchError(this.handleError)
    )
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

    switch (role) {
      case "ROLE_PROFESSOR":
        return ROLE.TEACHER
      case "ROLE_ADMIN":
        return ROLE.TEACHER     // TODO: gestire ADMIN
      default:
        return ROLE.STUDENT
    }


  }

  getEmail(): string {
    let session = JSON.parse(localStorage.getItem('session'));
    return session['email']
  }

  getUserNameAndSurname(): string {
    let session = JSON.parse(localStorage.getItem('session'));
    if (session['firstName'] && session['name'])
      return `${session['firstName']} ${session['name']}`
  }

  getId(): string {
    let session = JSON.parse(localStorage.getItem('session'));
    return session['id']
  }

  /*
  getEmail(): string {
    let session = JSON.parse(localStorage.getItem('session'));
    return session['email']
  }
  */

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
}
