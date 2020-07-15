import { Component, ViewChild, OnInit } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { MatDialog } from '@angular/material/dialog';
import { LoginDialogComponent } from './auth/login-dialog.component';
import { AuthService } from './services/auth.service';
import { Router, Event, NavigationEnd, ActivatedRoute } from '@angular/router';
import { TeacherService } from './services/teacher.service';
import { RegisterDialogComponent } from './auth/register-dialog.component';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  courses;
  selectedCourse;

  constructor(public dialog: MatDialog, private auth: AuthService, private router: Router, private route: ActivatedRoute,
    private teacher: TeacherService) {


    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {

        let doLogin = this.route.snapshot.queryParams.doLogin;
        let doRegister = this.route.snapshot.queryParams.doRegister;
        let redirect = this.route.snapshot.queryParams.redirect;

        if (doLogin) {
          this.openLoginDialog(redirect);
        }

        if (doRegister) {
          this.openRegisterDialog(redirect);
        }

      }
    });
  }

  selectCourse(course) {

    this.selectedCourse = course;
    this.router.navigate(['teacher', 'course', course.name, 'students']);
  }

  goToStudentsBar() {
    this.router.navigate(['teacher', 'course', this.selectedCourse.name, 'students']);
  }

  goToVMBar() {
    this.router.navigate(['teacher', 'course', this.selectedCourse.name, 'vms']);
  }

  @ViewChild(MatSidenav) sidenav: MatSidenav;

  ngOnInit() {
    this.teacher.getCourses().subscribe(data => {
      this.courses = data;
    });

    console.log("here");
  }


  toggleForMenuClick() {
    this.sidenav.toggle();
  }

  openLoginDialog(redirectUrl) {
    const dialogRef = this.dialog.open(LoginDialogComponent);

    dialogRef.afterClosed().subscribe(result => {

      if (redirectUrl == null || !this.auth.isLoggedIn())
        this.router.navigate(["home"]);
      else this.router.navigate([redirectUrl]);


    });
  }

  openRegisterDialog(redirectUrl) {
    const dialogRef = this.dialog.open(RegisterDialogComponent);

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
