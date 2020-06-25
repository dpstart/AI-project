import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import * as moment from 'moment';



@Injectable({
  providedIn: 'root'
})
export class AuthService {


  URL = "http://localhost:3000"
  constructor(private http: HttpClient) { }

  login(email: string, password: string) {
    const url = `${this.URL}/login`;
    return this.http.post<string>(url, { email: email, password: password });
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

  isLoggedIn() {

    if (localStorage.getItem('session') === null) return false;

    let session = JSON.parse(localStorage.getItem('session'));
    let isNotExpired = session["info"]["exp"] > moment().unix();
    return isNotExpired;
  }
}
