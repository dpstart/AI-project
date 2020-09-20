import { Component, ViewChild, OnInit, OnDestroy, OnChanges, SimpleChanges, AfterViewInit, ChangeDetectorRef, Input } from '@angular/core';
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
import { CreateDialogComponent } from './student/vm/create/create-dialog.component';
import { CreateCourseComponent } from './teacher/create-course/create-course.component';
import { Subscription } from 'rxjs';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {



  // Messaggio per UX
  message: string | null;
  alertType: string;

  // Corsi dell'utente in questione
  courses: Course[];

  // Nome del corso selezionato
  selectedCourse: string;

  // Nome e cognome che vengono visualizzati nella toolbar in alto a dx
  nameAndSurname: string;

  // src immagine di profilo, che se presente viene visualizzata 
  profilePicture: SafeResourceUrl

  // Link nelle tab dello studente o del professore a seconda di chi si logga
  navTeacherLinks: NavTeacherLinks[];
  navStudentLinks: NavStudentLinks[];

  // Profile Card inizialmente vuota
  profileCard: ProfileCard = {
    id: "",
    name: "",
    firstName: "",
    email: "",
    alias: ""
  }


  @ViewChild(MatSidenav) sidenav: MatSidenav;

  // Subscription
  routerEventSub: Subscription;
  courseSub: Subscription;
  profileCardSub: Subscription;
  profileImageSub: Subscription;
  clickTeacherTabSub: Subscription;
  clickStudentTabSub: Subscription;


  constructor(
    public dialog: MatDialog,
    public authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private teacherService: TeacherService,
    private studentService: StudentService,
    private routeStateService: RouteStateService,
    private sanitizer: DomSanitizer) {

    // Inizializzazioni variabili
    this.courses = []
    this.selectedCourse = ""
    this.nameAndSurname = ""
    this.navTeacherLinks = [];
    this.navStudentLinks = [];

    // Recupero risorse relative ai link
    this.navTeacherLinks = teacherService.getNavTeacherLinks();
    this.navStudentLinks = studentService.getNavStudentLinks();

    // Subscribe a eventi di navigazione
    this.routerEventSub = this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {

        let doLogin = this.activatedRoute.snapshot.queryParams.doLogin;
        let doRegister = this.activatedRoute.snapshot.queryParams.doRegister;

        // Se non si è loggati l'auth guard salva la url a cui si era diretti
        let redirect = this.activatedRoute.snapshot.queryParams.redirect;

        // Se è settato il Query Param doLogin bisogna andare al login
        if (doLogin) {
          this.openLoginDialog();
        }

        // Se è settato il Query Param doRegister bisogna andare al register
        if (doRegister) {
          this.openRegisterDialog(redirect);
        }
      }
    });
  }


  ngOnInit(): void {
    // Iscrizione al route state service per ottenere info relativa al corso selezionato, 
    // se non è stato ancora scelto allora data = Home 
    // altrimenti data = nome del corso scelto
    this.courseSub = this.routeStateService.pathParam.subscribe(data => this.selectedCourse = data)

    // Subscribe per eventi relativi alla profile card, dopo login => setto profile card
    this.profileCardSub = this.authService.getProfileCard().subscribe(value => {
      this.profileCard = value
    })

    // Subscribe per eventi relativi alla immagine di profilo, dopo login => setto immagine in profile card
    this.profileImageSub = this.authService.getProfileImage().subscribe(image => {

      // UTENTE non ha immagine di profilo allora setto a null, in modo da non visualizzarla
      if (image.picByte == null && image.type == null) {
        this.profilePicture = null
        return;
      }
      // Opportuna conversione per poter visualizzarla
      let base64Data = image.picByte;
      let formattedImage = `data:${image.type};base64,` + '\n' + base64Data;
      this.profilePicture = this.sanitizer.bypassSecurityTrustResourceUrl(formattedImage);
    })

    // Ottengo informazioni su utente loggato
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

      // Riemissione dell'evento perchè se utente ricarica pagina 
      // ma è loggato allora non passando dal login non avrà le info relative a se stesso
      this.authService.profileCard.next({
        id: id,
        name: name,
        firstName: firstName,
        email: email,
        alias: alias,
      })
    })

    // Richiesta immagine per lo stesso motivo della self, 
    // se utente è loggato e ricarica la pagina deve avere ancora immagine di profilo pur
    // non passando dal login
    // Se utente non è loggato allora si richiede immagine 
    // ma il server ritorna un valora di default e questo viene scartato 
    this.authService.getImage().subscribe(image => {
      this.authService.profileImage.next(image)
    })

    // Ottengo informazioni sui corsi dell'utente se loggato 
    this.retrieveCourses()
  }

  ngOnDestroy(): void {
    this.routerEventSub.unsubscribe()
    this.profileCardSub.unsubscribe()
    this.profileImageSub.unsubscribe()
    this.clickTeacherTabSub.unsubscribe()
    this.clickStudentTabSub.unsubscribe()
  }


  /**
   * Metodo che permette di ricavare informazioni su corsi di utente loggato che sia egli un prof o uno studente
   * Se utente non è loggato allora la funzione non fa nulla
   */
  private retrieveCourses() {

    // Controllo se utente è loggato
    if (this.authService.isLoggedIn()) {

      // Se è un prof
      if (this.authService.isRoleTeacher())
        // Ottengo corsi del professore
        this.teacherService.getCourses().subscribe((data: Course[]) => {

          // Se ci sono dei corsi e ti trovi sulla Home non avendo ancora selezionato nessun corso,
          // allora ti invito a scegliere un corso aprendo la sidenav
          if (data.length != 0 && this.selectedCourse == "Home") {
            this.sidenav.open()
          }
          this.courses = data;
        })
      else // Se è uno studente
        // Ottengo corsi studente
        this.studentService.getCourses().subscribe((data: Course[]) => {

          // Se ci sono dei corsi e ti trovi sulla Home non avendo ancora selezionato nessun corso,
          // allora ti invito a scegliere un corso aprendo la sidenav
          if (data.length != 0 && this.selectedCourse == "Home") {
            this.sidenav.open()
          }
          this.courses = data;
        })
    }
  }


  /**
   * Metodo che permette di reagire alla selezione di un corso, avvisando tutti i componenti che sono interessati a ciò
   * @param course 
   */
  selectCourse(course: Course) {

    // Avviso tutti i componenti che si sono sottoiscritti a questa BehaviorSubject
    // che il corso selezionato è cambiato
    this.routeStateService.updatePathParamState(course.name)

    // Di default si viene indirizzati sulla prima tab del prof o dello studente a seconda
    // di chi si logga
    if (this.authService.isRoleTeacher())
      this.router.navigate(['teacher', 'course', course.name, 'students']);
    else
      this.router.navigate(['student', 'course', course.name, 'groups']);

    this.sidenav.close()
  }

  /**
   * Metodo che permette di reagire alla selezione di un tab da parte del teacher
   * @param link 
   */
  onClickTeacherTab(link: string) {

    // Voglio solo una sub
    if (this.clickTeacherTabSub) this.clickTeacherTabSub.unsubscribe()

    this.clickTeacherTabSub = this.routeStateService.pathParam.subscribe(courseSelected => {

      if (courseSelected !== "Home")
        this.router.navigate(['teacher', 'course', courseSelected, link]);
      else
        this.sidenav.open()
    })
  }


  /**
   * Metodo che permette di reagire alla selezione di un tab da parte del professore
   * @param link 
   */
  onClickStudentTab(link: string) {

    // Voglio solo una sub
    if (this.clickStudentTabSub) this.clickStudentTabSub.unsubscribe()

    this.clickStudentTabSub = this.routeStateService.pathParam.subscribe(courseSelected => {
      if (courseSelected !== "Home")
        this.router.navigate(['student', 'course', courseSelected, link]);
      else {
        this.sidenav.open()
      }
    })
  }

  // Metodo per reagire alla pressione del menu per aprire e chiudere la sidenav
  toggleForMenuClick() {
    this.sidenav.toggle();
  }

  /**
   * Metodo che permette di aprire il login dialog ed effettuare successivamente l'autenticazione
   * alla pressione del bottone login 
   */
  openLoginDialog() {
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

  /**
   * Metodo che permette di aprire il register dialog ed effettuare successivamente la registrazione
   * alla pressione del bottone register
   */
  openRegisterDialog(redirectUrl) {
    const dialogRef = this.dialog.open(RegisterDialogComponent);

    dialogRef.afterClosed().subscribe(result => {

      if (redirectUrl == null || !this.authService.isLoggedIn())
        this.router.navigate(["home"]);
      else this.router.navigate([redirectUrl]);

    });
  }

  /**
   *  Wrapper della funzione isLoggedIn
   */
  isLoggedIn() {
    return this.authService.isLoggedIn();
  }

  /**
   * Metodo che permette di effettuare il logout
   */
  logout() {
    this.authService.logout()
    this.sidenav.close()
    this.router.navigate(["home"])

  }

  /**
   * Wrapper funzione isRoleTeacher
   */
  isRoleTeacher() {
    return this.authService.isRoleTeacher()
  }

  /**
   * Wrapper funzione isRoleStudent
   */
  isRoleStudent() {
    return this.authService.isRoleStudent()
  }

  /**
   * Metodo che permette apertura dialog di creazione del corso
   */
  openAddCourseDialog() {

    const dialogRef = this.dialog.open(CreateCourseComponent, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe((data) => {

      // Una volta che il corso è stato aggiunto, aggiorno il source corsi
      this.retrieveCourses()

      if (!data) return;

      // Se il messaggio è settato
      this.message = data.message;
      this.alertType = data.type

      setTimeout(() => {
        this.message = ""
      }, 3000)
    })
  }
}
