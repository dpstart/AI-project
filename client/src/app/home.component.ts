import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-home',
  template: `
  <mat-card *ngIf="isLoggedIn()"><h1>Select a course to continue</h1></mat-card>
  <mat-card *ngIf="!isLoggedIn()"><h1>Log in or Register to Continue</h1></mat-card>
  `,
  styles: ['mat-card{text-align:center}']
})
export class HomeComponent implements OnInit {

  constructor(private auth: AuthService) { }

  ngOnInit(): void {
  }

  isLoggedIn() {
    return this.auth.isLoggedIn()
  }

}
