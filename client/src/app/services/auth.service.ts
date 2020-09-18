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

export interface RegisteredUserForm {
  id: string
  name: string
  firstName: string
  password: string
  email: string
}


export interface ProfileCard {
  id: string,
  name: string,
  firstName: string,
  alias: string,
  email: string
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {


  /**
   * Variabile che permette l'emissione di una profileCard 
   */
  private _profileCard: Subject<ProfileCard>;
  private _profileImage: Subject<Image>;

  ////////////// GETTERS ///////////////////
  public get profileCard(): Subject<ProfileCard> {
    return this._profileCard;
  }
  public getProfileCard(): Observable<ProfileCard> {
    return this._profileCard.asObservable();
  }
  public get profileImage(): Subject<Image> {
    return this._profileImage;
  }
  public getProfileImage(): Observable<Image> {
    return this._profileImage.asObservable();
  }
  /////////////////////////////////////////

  /////////////// SETTERS /////////////////
  public set profileCard(value: Subject<ProfileCard>) {
    this._profileCard = value;
  }
  public set profileImage(value: Subject<Image>) {
    this._profileImage = value;
  }
  /////////////////////////////////////////

  URL = "http://localhost:4200/API"

  constructor(private http: HttpClient, private routeStateService: RouteStateService) {
    this.profileCard = new Subject<ProfileCard>()
    this.profileImage = new Subject<Image>()
  }

  /**
   * Metodo che permette di effettuare una richiesta di login passando un oggetto con campi email e password
   * @param email 
   * @param password 
   */
  login(email: string, password: string) {
    const url = `${this.URL}/login`;
    return this.http.post<string>(url, { username: email, password: password }).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

  /**
   * Metodo che permette di effettuare una richiesta di registrazione passando in un form:
   * RegisteredUserForm{
   * id: string
   * name: string
   * firstName: string
   * password: string
   * email: string
   * } 
   * e se setttata l'immagine dello user che si vuole registrare
   * @param user 
   * @param file 
   */
  register(user: RegisteredUserForm, file: File): Observable<RegisteredUserForm> {

    const formData = new FormData();

    let headers = new HttpHeaders()
    headers.set('Content-Type', 'multipart/form-data;');


    // Il tentativo di discernere la fine della mail non è un aggiunta di un livello di sicurezza 
    // ma serve solo a discernere quale API contattare
    if (user.email.includes("@studenti.polito.it")) {

      let url = `${this.URL}/students`;
      user.email = null;

      formData.append('student', new Blob([JSON.stringify(user)], {
        type: "application/json"
      }))

      if (file)
        formData.append('image', file, file.name);

      return this.http.post<RegisteredUserForm>(url, formData, { "headers": headers }).pipe(
        retry(3),
        catchError(this.handleError)
      );
    } else {
      if (!user.email.includes("@polito.it")) {
        throwError("Wrong Format")
      }
      let url = `${this.URL}/professors`;
      if (file)
        formData.append('image', file, file.name);

      user.email = null;

      formData.append('professor', new Blob([JSON.stringify(user)], {
        type: "application/json"
      }))
      return this.http.post<RegisteredUserForm>(url, formData, { "headers": headers }).pipe(
        retry(3),
        catchError(this.handleError)
      );
    }
  }

  /**
   * Metodo che permette di effettuare il logout rimuovendo l'oggetto sessione
   */
  logout() {
    localStorage.removeItem('session');
    this.routeStateService.updatePathParamState("Home")
    this.profileImage.next(new Image(null, null))
  }


  /**
   * Metodo che permette di ricavare le informazioni riguardo allo user che effettua la richiesta
   * ritorna a seconda di chi sia uno Student oppure un Professor
   */
  getSelf(): Observable<any> {

    let url = "";
    //TODO admin??
    if (this.isRoleTeacher()) {

      url = `${this.URL}/professors/self`;

    } else {

      if (this.isRoleStudent()) {
        url = `${this.URL}/students/self`;
      } else
        return new Observable()
    }

    return this.http.get<any>(url).pipe(
      retry(3),
      catchError(this.handleError)
    )
  }


  /**
   * Metodo che permette di otterne l'immmagine dell'utente che effettua la chiamata
   */
  getImage(): Observable<Image> {

    let url = "";
    //TODO admin??
    if (this.isRoleTeacher()) {

      url = `${this.URL}/professors/image`;

    } else {
      if (this.isRoleStudent())
        url = `${this.URL}/students/image`;
      else
        return new Observable()
    }

    return this.http.get<Image>(url).pipe(
      retry(3),
      catchError(this.handleError)
    )
  }


  /**
   * Metodo che permette di recuperare il token di autenticazione di utente loggato 
   */
  getAccessToken() {

    var session = localStorage.getItem('session');
    if (session === null) return;

    session = JSON.parse(session);
    return session["token"];
  }

  /**
   * Metodo che permette di ottenere il ruolo di utente loggato 
   */
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

  /**
   * Metodo che permette di ottenere la mail di utente loggato 
   */
  getEmail(): string {
    let session = JSON.parse(localStorage.getItem('session'));
    return session['email']
  }

  /**
   * Metodo che permette di ottenere la nome e cognome di utente loggato  
   */
  getUserNameAndSurname(): string {
    let session = JSON.parse(localStorage.getItem('session'));
    if (session['firstName'] && session['name'])
      return `${session['firstName']} ${session['name']}`
  }
  /**
    * Metodo che permette di ottenere la matricola di utente loggato  
   */
  getId(): string {
    let session = JSON.parse(localStorage.getItem('session'));
    return session['id']
  }

  /**
   * Metodo che permette di sapere se l'utente loggato è uno studente   
   */
  isRoleStudent() {
    return this.getRole() == ROLE.STUDENT
  }

  /**
   * Metodo che permette di sapere se l'utente loggato è un professore     
   */
  isRoleTeacher() {
    return this.getRole() == ROLE.TEACHER;
  }

  /**
 * Metodo che permette di sapere se l'utente è loggato     
 */
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
        `body was: ${error.message}`);
    }
    // return an observable with a user-facing error message

    console.log(error)
    return throwError({ status: error.status, message: error.message });
  };
}
