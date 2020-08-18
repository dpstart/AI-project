import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import * as moment from 'moment';

export enum ROLE {
  TEACHER,
  STUDENT
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {


  URL = "http://localhost:8080"
  constructor(private http: HttpClient) { }

  login(email: string, password: string) {
    const url = `${this.URL}/authenticate`;
    return this.http.post<string>(url, { username: email, password: password });
  }

  register(first_name: string, last_name: string, id: string, email: string, password: string) {
    const url = `${this.URL}/API/students`;
    return this.http.post<string>(url, { firstName: first_name, name: last_name, id: id, email: email, password: password });
  }

  logout() {
    localStorage.removeItem('session');
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

    if (role == "ROLE_ADMIN")
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
