import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { MatDialog } from '@angular/material/dialog';
import { LoginDialogComponent } from './auth/login-dialog.component';
import { AuthService } from './services/auth.service';
import { Router, Event, NavigationEnd, ActivatedRoute } from '@angular/router';
import { TeacherService, NavTeacherLinks } from './services/teacher.service';
import { RegisterDialogComponent } from './auth/register-dialog.component';
import { Course } from './model/course.model';
import { StudentService, NavStudentLinks } from './services/student.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  courses: Course[];
  selectedCourse: Course;
  navTeacherLinks: NavTeacherLinks[];
  navStudentLinks: NavStudentLinks[];


  constructor(public dialog: MatDialog, private authService: AuthService, private router: Router, private activatedRoute: ActivatedRoute,
    private teacherService: TeacherService, private studentService: StudentService) {


    this.navTeacherLinks = teacherService.getNavTeacherLinks();
    this.navStudentLinks = studentService.getNavStudentLinks();

    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {

        let doLogin = this.activatedRoute.snapshot.queryParams.doLogin;
        let doRegister = this.activatedRoute.snapshot.queryParams.doRegister;
        let redirect = this.activatedRoute.snapshot.queryParams.redirect;

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
    if (this.authService.isRoleTeacher())
      this.router.navigate(['teacher', 'course', course.name, 'students']);
    else
      this.router.navigate(['student', 'course', course.name, 'groups']);



  }

  onClickTeacherTab(link: string) {
    this.router.navigate(['teacher', 'course', this.teacherService.getSelectedCourse(), link]);
  }


  onClickStudentTab(link: string) {
    this.router.navigate(['student', 'course', this.teacherService.getSelectedCourse(), link]);
  }


  @ViewChild(MatSidenav) sidenav: MatSidenav;

  ngOnInit() {
    if (this.authService.isLoggedIn) {
      // user is logged
      this.teacherService.getCourses().subscribe((data: Course[]) => {
        this.courses = data;
        if (this.courses[0].name)
          this.teacherService.setCourse(this.courses[0].name)
      });

    }
  }

  ngOnDestroy() {
  }


  toggleForMenuClick() {
    this.sidenav.toggle();
  }

  openLoginDialog(redirectUrl) {
    const dialogRef = this.dialog.open(LoginDialogComponent);

    dialogRef.afterClosed().subscribe(result => {

      if (!this.authService.isLoggedIn()) {

        this.router.navigate(["home"]);

      }
      else {
        // user is logged
        this.teacherService.getCourses().subscribe((data: Course[]) => {
          this.courses = data;
          if (this.courses[0].name)
            this.teacherService.setCourse(this.courses[0].name)
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

      if (redirectUrl == null || !this.authService.isLoggedIn())
        this.router.navigate(["home"]);
      else this.router.navigate([redirectUrl]);

    });
  }

  isLoggedIn() {
    return this.authService.isLoggedIn();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(["home"])
    this.sidenav.close()
  }

  isRoleTeacher() {
    return this.authService.isRoleTeacher()
  }
  isRoleStudent() {
    return this.authService.isRoleStudent()
  }

}
