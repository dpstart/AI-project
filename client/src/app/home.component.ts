import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-home',
  template: `
  <mat-card *ngIf="isLoggedIn()"><h1>Select a course to continue</h1></mat-card>
  <mat-card *ngIf="!isLoggedIn()"><h1>Log in or Register to Continue</h1></mat-card>

  <div class="main-div">
  <mat-card *ngIf="!isLoggedIn()" style="width:50%;">
  <button style="margin-right:10px" mat-raised-button color="primary" mat-button [routerLink]="['.']" [queryParams]="{doLogin: true}">Login</button>
  <button mat-raised-button color="primary" [routerLink]="['.']" [queryParams]="{doRegister: true}">Register</button>
  </mat-card>
  </div>
  `,
  styles: [`
  mat-card{text-align:center; margin:20px} 
  .main-div{
    display: flex;
    justify-content: center;
    align-items: center;
  }`]
})
export class HomeComponent implements OnInit {

  constructor(private auth: AuthService) { }

  ngOnInit(): void {
  }

  isLoggedIn() {
    return this.auth.isLoggedIn()
  }

}
