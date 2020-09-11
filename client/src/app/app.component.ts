import { Component, ViewChild, OnInit, OnDestroy, OnChanges, SimpleChanges, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { MatDialog } from '@angular/material/dialog';
import { LoginDialogComponent } from './auth/login-dialog.component';
import { AuthService, ProfileCard } from './services/auth.service';
import { Router, Event, NavigationEnd, ActivatedRoute, ParamMap } from '@angular/router';
import { TeacherService, NavTeacherLinks } from './services/teacher.service';
import { RegisterDialogComponent } from './auth/register-dialog.component';
import { Course } from './model/course.model';
import { StudentService, NavStudentLinks } from './services/student.service';
import { RouteStateService } from './services/route-state.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { take, first } from 'rxjs/operators';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  courses: Course[];
  selectedCourse: string;

  nameAndSurname: string;

  profilePicture: SafeResourceUrl

  navTeacherLinks: NavTeacherLinks[];
  navStudentLinks: NavStudentLinks[];

  profileCard: ProfileCard = {
    id: "",
    name: "",
    firstName: "",
    email: "",
    alias: ""
  }

  @ViewChild(MatSidenav) sidenav: MatSidenav;


  constructor(
    public dialog: MatDialog,
    public authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private teacherService: TeacherService,
    private studentService: StudentService,
    private routeStateService: RouteStateService,
    private sanitizer: DomSanitizer) {


    this.courses = []
    this.selectedCourse = ""
    this.nameAndSurname = ""
    this.profilePicture = ""
    this.navTeacherLinks = [];
    this.navStudentLinks = [];

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


  ngOnInit() {
    this.routeStateService.pathParam.subscribe(data => this.selectedCourse = data)

    this.authService.getProfileCard().subscribe(value => {

      this.profileCard = value
    })


    this.authService.getProfileImage().subscribe(image => {

      let base64Data = image.picByte;
      let formattedImage = `data:${image.type};base64,` + '\n' + base64Data;
      this.profilePicture = this.sanitizer.bypassSecurityTrustResourceUrl(formattedImage);
    })

    this.authService.getSelf().subscribe((data) => {

      let id = "";
      let email = "";
      let name = "";
      let firstName = "";
      let alias = "";

      if (data.email)
        email = data.email;
      if (data.alias)
        alias = data.alias;
      if (data.firstName)
        firstName = data.firstName;
      if (data.name)
        name = data.name;
      if (data.id)
        id = data.id;

      this.authService.profileCard.next({
        id: id,
        name: name,
        firstName: firstName,
        email: email,
        alias: alias,
      })
    })


    this.authService.getImage().subscribe(success => {
      this.authService.profileImage.next(success)
    })

    this.retrieveCourses()


  }


  private retrieveCourses() {

    if (this.authService.isLoggedIn()) {


      if (this.authService.isRoleTeacher())
        this.teacherService.getCourses().subscribe((data: Course[]) => {
          if (data.length != 0 && this.selectedCourse == "Home") {
            this.sidenav.open()
          }
          this.courses = data;
        })
      else
        this.studentService.getCourses().subscribe((data: Course[]) => {
          if (data.length != 0 && this.selectedCourse == "Home") {
            this.sidenav.open()
          }
          this.courses = data;
        })
    }
  }



  selectCourse(course: Course) {
    this.routeStateService.updatePathParamState(course.name)

    if (this.authService.isRoleTeacher())
      this.router.navigate(['teacher', 'course', course.name, 'students']);
    else
      this.router.navigate(['student', 'course', course.name, 'groups']);


    this.sidenav.close()

  }

  onClickTeacherTab(link: string) {
    this.routeStateService.pathParam.subscribe(courseSelected => {
      if (courseSelected !== "Home")
        this.router.navigate(['teacher', 'course', courseSelected, link]);
      else
        this.sidenav.open()


    })
  }
  onClickStudentTab(link: string) {
    this.routeStateService.pathParam.subscribe(courseSelected => {
      if (courseSelected !== "Home")
        this.router.navigate(['student', 'course', courseSelected, link]);
      else {
        this.sidenav.open()
      }
    })
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
        this.retrieveCourses()
      };
    })
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
