import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Course } from 'src/app/model/course.model';
import { Student } from 'src/app/model/student.model';
import { RouteStateService } from 'src/app/services/route-state.service';
import { TeacherService } from 'src/app/services/teacher.service';


export interface Message {
  message: string
  alertType: string
}
@Component({
  selector: 'app-course-management-container',
  templateUrl: './course-management-container.component.html',
  styleUrls: ['./course-management-container.component.css']
})
export class CourseManagementContainerComponent implements OnInit {

  /*
[message]="message"
[courseObj]="courseObj"
[selectedCourse]="selectedCourse"
[studentsNotInCourse]="studentsNotInCourse"
[enrolledStudents]="enrolledStudents" 
(addStudent)="addStudent($event)" 
(deleteStudents)="deleteStudents($event)"
(enrollManyCsvEvent)="enrollManyCSV($event)"
(updateCourse)="updateCourse($event)"
(removeCourse)="removeCourse($event)">
  */

  // Messaggio da passare al componente dummy in base a come sono andate le richieste
  message: Message
  // Corso selezionato
  courseObj: Course
  // Nome del corso
  selectedCourse: string

  // Data sources
  studentsNotInCourse: Student[];
  enrolledStudents: Student[];
  // Flag usato per caricare tutte le informazioni mentre è presente il loading 
  // e poi far visualizzare il componente dummy
  isAllStudentsLoaded: boolean = false;
  isEnrolledStudentsLoaded: boolean = false;

  //Studenti che devono essere eliminati
  studentsToDelete: Student[];

  courseSub: Subscription

  constructor(
    private teacherService: TeacherService,
    private activatedRoute: ActivatedRoute,
    private routeStateService: RouteStateService,
    private router: Router
  ) {
    // Settaggio iniziale 
    this.message = { message: "", alertType: "" }
  }

  ngOnInit() {
    // sottoscrivo a cambiamenti nella url del corso
    this.courseSub = this.activatedRoute.params.subscribe(params => {
      if (params['course_name']) {

        // Emissione evento per il corso in questione 
        this.routeStateService.updatePathParamState(params['course_name'])

        // Setto il nome del corso 
        this.selectedCourse = params["course_name"];

        // Prendo le info del corso in base al nome
        this.teacherService.getCourse(this.selectedCourse).subscribe((course: Course) => {
          // Setto il corso in base a quello che mi viene ritornato
          this.courseObj = course

          // Ritiro gli studenti del corso in questione
          this.teacherService.getStudentsInCourse(this.selectedCourse).subscribe(enrolledStudents => {

            // Setto gli studenti che sono iscritti al corso
            this.enrolledStudents = enrolledStudents;

            // Prendo tutti gli studenti che sono registrati sulla piattaforma
            this.teacherService.getStudents().subscribe(allStudents => {

              // Array di supporto per definire quali studenti non sono in team
              let allStudentsNotInCourse = []

              for (let student of allStudents) {

                // Se non trovo l'indice negli studenti del corso allora lo studente non è nel corso 
                if (this.enrolledStudents.findIndex(x => student.id === x.id) == -1)
                  allStudentsNotInCourse.push(student)
              }

              // Aggiorno data sources
              this.studentsNotInCourse = allStudentsNotInCourse
              this.isAllStudentsLoaded = true;
              this.isEnrolledStudentsLoaded = true;
            })
          });
        }, (_) => this.router.navigate(['PageNotFound']))
      }
    })
  }

  ngOnDestroy() {
    this.courseSub.unsubscribe()
  }

  /**
   * Metodo che permette di aggiungere lo studente passato come parametro al corso
   * @param student 
   */
  addStudent(student: Student) {

    // Controllo che lo studente non sia già registrato al corso
    if (this.enrolledStudents.indexOf(student) != -1) {
      let message = {} as Message
      message.alertType = "danger"
      message.message = "Sorry something went wrong try later..."
      this.message = { ...message }
      this.closeAlertAfterTime(3000)
      return;
    }
    // Se non lo è allora effettuo richiesta di registratzione 
    this.teacherService
      .enrollOne(this.selectedCourse, student.id)
      .subscribe(success => {
        var data = this.enrolledStudents;
        data.push(student);
        this.enrolledStudents = [].concat(data);
        // remove from all students not in course
        this.studentsNotInCourse = this.studentsNotInCourse.filter(s => s.id != student.id)

        // Messaggio da settare in caso di successo
        let message = {} as Message
        message.alertType = "success"
        message.message = "Student successfully added."
        this.message = { ...message }
        this.closeAlertAfterTime(3000)

      }, error => {
        // Messaggio in caso di errore
        let message = {} as Message
        message.alertType = "danger"
        message.message = "Sorry something went wrong try later..."
        this.message = { ...message }

        this.closeAlertAfterTime(3000)
      })

  }

  /**
   * Metodo che premette di cancellare gli studenti passati come parametro
   * @param students 
   */
  deleteStudents(students: Student[]) {

    // Effettuo richiesta per rimuovere gli studenti dal corso
    this.teacherService.unsubscribe(this.selectedCourse, students).subscribe(_ => {

      let studentsEnrolled: Student[] = this.enrolledStudents

      let studentsNotInCourse = [...this.studentsNotInCourse]

      // Per ogni studente che deve essere rimosso
      students.forEach(s => {
        // Rimuovo lo studente dagli enrolled  
        studentsEnrolled = studentsEnrolled.filter(student => student.id != s.id)
        // E lo aggiungo agli studenti non in corso
        studentsNotInCourse.push(s)
      });

      // Aggiornamento dati
      this.enrolledStudents = studentsEnrolled
      this.studentsNotInCourse = studentsNotInCourse


      let message = {} as Message
      message.alertType = "success"

      // Distinzione messaggio
      if (students.length == 1)
        message.message = `Student successfully removed from course ${this.selectedCourse}.`
      else
        message.message = `Students successfully removed from course ${this.selectedCourse}.`
      // Setto messaggio
      this.message = { ...message }
      this.closeAlertAfterTime(3000)
    }, error => {
      // In caso di errore setto messaggio
      let message = {} as Message
      message.alertType = "danger"
      message.message = "Sorry something went wrong try later..."
      this.message = { ...message }
      this.closeAlertAfterTime(3000)
    })
  }

  /**
   * Metodo che permette di aggiungere gli studenti passando un file CSV
   * @param file 
   */
  enrollManyCSV(file: File) {

    // Effettuo richiesta di aggiunta studenti passando il file
    this.teacherService.enrollManyCSV(this.selectedCourse, file).subscribe(_ => {

      // Se sono stati aggiunti allora devo aggiornare il source
      this.teacherService.getStudentsInCourse(this.selectedCourse).subscribe(data => {
        this.enrolledStudents = data;

        // Prendo tutti gli studenti che sono registrati sulla piattaforma
        this.teacherService.getStudents().subscribe(allStudents => {

          // Array di supporto per definire quali studenti non sono in team
          let allStudentsNotInCourse = []

          for (let student of allStudents) {

            // Se non trovo l'indice negli studenti del corso allora lo studente non è nel corso 
            if (this.enrolledStudents.findIndex(x => student.id === x.id) == -1)
              allStudentsNotInCourse.push(student)
          }

          // Aggiorno data sources
          this.studentsNotInCourse = allStudentsNotInCourse
          this.isAllStudentsLoaded = true;
          this.isEnrolledStudentsLoaded = true;

          // Setto messaggio di successo
          let message = {} as Message
          message.alertType = "success"
          message.message = "Student successfully added"
          this.message = { ...message }
          this.closeAlertAfterTime(3000)
        })
      });
    }, _ => {
      let message = {} as Message
      message.alertType = "danger"
      message.message = "Sorry something went wrong try later..."
      this.message = { ...message }
      this.closeAlertAfterTime(3000)
    })
  }

  setVmModelForCourse(data: { course: Course, vmModel: string }) {


    this.teacherService.setVmModelForCourse(data.course.name, data.vmModel).subscribe(
      () => {
        let message = {} as Message
        message.alertType = "success"
        message.message = "Vm Model set."
        this.message = { ...message }
      },
      error => {


        let message = {} as Message
        message.alertType = "danger"
        message.message = error.message
        this.message = { ...message }
      })

  }

  /**
   * Metodo che permette di aggiornare i parametri di un corso
   * @param courses: contiene due elementi: [ versione aggiornata , versione originaria] 
   */
  updateCourse(courses: Course[]) {

    // Controllo validità richiesta
    if (courses[0].min > courses[0].max) {
      this.courseObj = { ...courses[1] } as Course
      // Setto messaggio di errore
      let message = {} as Message
      message.alertType = "danger"
      message.message = "Impossible to set a minimum number of members greater than the maximum one "
      this.message = { ...message }
      this.closeAlertAfterTime(3000)
      return;
    }

    // Richista aggiornamento corso
    this.teacherService.updateCourse(courses[0]).subscribe(response => {

      // Aggiornamento ha avuto successo
      this.courseObj = { ...response } as Course

      let message = {} as Message
      message.alertType = "success"
      message.message = "Course modified successfully."
      this.message = { ...message }
      this.closeAlertAfterTime(3000)

    }, error => {

      // Se l'aggiornamento non va a buon fine risetto il corso alla configurazione originaria
      this.courseObj = { ...courses[1] } as Course
      // Setto messaggio di errore
      let message = {} as Message
      message.alertType = "danger"
      message.message = error.message
      this.message = { ...message }
      this.closeAlertAfterTime(3000)
    })
  }
  /**
   * Metodo che permette di rimuovere il corso che ha il nome passato come parametro
   * @param courseName 
   */
  removeCourse(courseName: string) {
    // Effettuo richiesta di rimozione
    this.teacherService.removeCourse(courseName).subscribe(_ => {
      let message = {} as Message
      message.alertType = "success"
      message.message = "Course removed successfully."

      // Se il corso è stato cancellato allora dopo tre secondi si viene rediretti alla home
      setTimeout(_ => {
        this.message.message = ""
        this.message.alertType = ""
        this.router.navigate(['home'])
        this.routeStateService.updatePathParamState("Home")
      }, 3000)
      this.message = { ...message }

    }, error => {
      // Setto messaggio di errore
      let message = {} as Message
      message.alertType = "danger"
      message = error.message
      this.message = { ...message }
      this.closeAlertAfterTime(3000)
    })
  }

  /**
 * Utility function used to close alert after tot milliseconds 
 * @param milliseconds 
 */
  closeAlertAfterTime(milliseconds: number) {
    setTimeout(_ => {
      this.message.message = ""
      this.message.alertType = ""
    }, milliseconds)
  }
}
