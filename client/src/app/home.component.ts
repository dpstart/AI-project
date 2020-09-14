import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  template: `
  <mat-card><h1>Select a course to continue</h1></mat-card>
  `,
  styles: ['mat-card{text-align:center}']
})
export class HomeComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
