import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { MatDialog } from '@angular/material/dialog';
import { LoginDialogComponent } from './auth/login-dialog.component';
import { AuthService } from './services/auth.service';
import { Router, Event, NavigationEnd, ActivatedRoute } from '@angular/router';
import { TeacherService } from './services/teacher.service';
import { RegisterDialogComponent } from './auth/register-dialog.component';
import { Course } from './model/course.model';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  courses: Course[];
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

    this.router.navigate(['teacher', 'course', course.name, 'students']);
  }

  goToStudentsBar() {
    this.router.navigate(['teacher', 'course', this.teacher.getSelectedCourse(), 'students']);
  }

  goToVMBar() {
    this.router.navigate(['teacher', 'course', this.teacher.getSelectedCourse(), 'vms']);
  }

  goToHomeworkBar() {
    this.router.navigate(['teacher', 'course', this.teacher.getSelectedCourse(), 'homework']);

  }

  @ViewChild(MatSidenav) sidenav: MatSidenav;

  ngOnInit() {
    if (this.auth.isLoggedIn())
      this.teacher.getCourses().subscribe((data:Course[]) => {
        this.courses = data;
        this.teacher.setCourse(this.courses[0].name)
      });

  }

  ngOnDestroy() {
  }


  toggleForMenuClick() {
    this.sidenav.toggle();
  }

  openLoginDialog(redirectUrl) {
    const dialogRef = this.dialog.open(LoginDialogComponent);

    dialogRef.afterClosed().subscribe(result => {

      if (!this.auth.isLoggedIn()) {

        this.router.navigate(["home"]);

      }
      else {
        // user is logged
        this.teacher.getCourses().subscribe((data:Course[]) => {
          this.courses = data;
        });

        if (redirectUrl == null)
          this.router.navigate(["home"]);
        else
          this.router.navigate([redirectUrl]);

      }

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
    this.router.navigate(["home"])
    this.sidenav.close()
  }

  isRoleTeacher() {
    return this.auth.isRoleTeacher()
  }
  isRoleStudent() {
    return this.auth.isRoleStudent()
  }

}
