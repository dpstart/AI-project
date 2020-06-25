import { Component, ViewChild, OnInit } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { MatDialog } from '@angular/material/dialog';
import { LoginDialogComponent } from './auth/login-dialog.component';
import { AuthService } from './services/auth.service';
import { Router, Event, NavigationEnd, ActivatedRoute } from '@angular/router';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  courses = ["Applicazioni Internet", "Programmazione di sistema"];

  constructor(public dialog: MatDialog, private auth: AuthService, private router: Router, private route: ActivatedRoute) {


    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {

        let doLogin = this.route.snapshot.queryParams.doLogin;
        let redirect = this.route.snapshot.queryParams.redirect;

        if (doLogin) {
          this.openDialog(redirect);
        }

      }
    });
  }

  navLinks = [
    { path: 'teacher/course/applicazioni-internet/students', label: 'Students' },
    { path: 'teacher/course/applicazioni-internet/vms', label: 'VM' },
  ];


  @ViewChild(MatSidenav) sidenav: MatSidenav;


  toggleForMenuClick() {
    this.sidenav.toggle();
  }

  openDialog(redirectUrl) {
    const dialogRef = this.dialog.open(LoginDialogComponent);

    dialogRef.afterClosed().subscribe(result => {

      if (redirectUrl == null || !this.auth.isLoggedIn())
        this.router.navigate(["home"]);
      else this.router.navigate([redirectUrl]);


    });
  }

  isLoggedIn() {
    return this.auth.isLoggedIn();
  }

  logout() {
    this.auth.logout();
  }

}
