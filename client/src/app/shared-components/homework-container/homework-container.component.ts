import { Component, OnInit } from '@angular/core';
import { DisplayedHomework, DisplayedAssignment } from '../homework/homework.component';
import { ActivatedRoute, Router } from '@angular/router';
import { RouteStateService } from 'src/app/services/route-state.service';
import { TeacherService } from 'src/app/services/teacher.service';
import { Assignment } from 'src/app/model/assignment.model';
import { Homework } from 'src/app/model/homework.model';
import { Student } from 'src/app/model/student.model';
import { Image } from 'src/app/model/image.model';
import { DomSanitizer } from '@angular/platform-browser';


const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' };

@Component({
  selector: 'app-homework-container',
  templateUrl: './homework-container.component.html',
  styleUrls: ['./homework-container.component.css']
})
export class HomeworkContainerComponent implements OnInit {
  /* Questo componente è il container di Homework component. Il suo scopo sarà quello di ritirare tutti i dati 
     e passarli una volta ottenuti al figlio.  */

  //** Proprietà da passare a HomeworkContainer
  selectedCourse: string
  displayedHomeworks: DisplayedHomework[];
  displayedAssignments: DisplayedAssignment[]
  //** 

  // flag usato per visualizzare loading 
  isAllLoaded: boolean


  constructor(
    private activatedRoute: ActivatedRoute,
    private routeStateService: RouteStateService,
    private teacherService: TeacherService,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {
    //Inizializzazione
    this.displayedAssignments = []
    this.displayedHomeworks = []
    this.isAllLoaded = false
  }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params) => {
      if (params['course_name']) {
        this.routeStateService.updatePathParamState(params['course_name'])

        // Inizializzo nome corso
        this.selectedCourse = params['course_name']


        // Ritiro assignment relato al corso in questione
        this.teacherService.getAssignmentsByCourse(this.selectedCourse).subscribe((assignments: Assignment[]) => {

          //New Assignment source
          let displayedAssignments: DisplayedAssignment[] = []

          //new Homeworks source
          let displayHomeworks: DisplayedHomework[] = []

          //contatore usato per discernere quando tutti i dati sono stati ottenuti
          let counter = 0


          // Se effettivamente ci sono assignments
          if (assignments.length != 0) {

            //Per ogni assignment...
            for (let i = 0; i < assignments.length; i++) {

              // Ritiro l'immagine che lo caratterizza
              this.teacherService.getResourceByUrl(assignments[i].links.find(link => link.rel === "image").href).subscribe((success: Image) => {

                let base64Data = success.picByte;
                let formattedImage = `data:${success.type};base64,` + '\n' + base64Data;
                let imagesrc = this.sanitizer.bypassSecurityTrustResourceUrl(formattedImage);

                //Convertion to displayed assignment
                let displayedAssignment: DisplayedAssignment = {
                  id: assignments[i].id,
                  releaseDate: new Date(assignments[i].releaseDate).toLocaleDateString(undefined, options),
                  expirationDate: new Date(assignments[i].expirationDate).toLocaleDateString(undefined, options),
                  srcImage: imagesrc,
                  expirationDateObj: new Date(assignments[i].expirationDate),
                  isDeletable: true // settato a true ma poi viene definito se può essere cancellato o meno
                }

                //add converted element to assignment source
                displayedAssignments.push(displayedAssignment)

                //get homeworks that corresponds to assignment
                this.teacherService.getHomeworksByAssignment(this.selectedCourse, assignments[i].id).subscribe((homeworks: Homework[]) => {



                  let counterHw = 0

                  // se non ci sono hw incremento e vado avanti, solo se sono l'ultimo allora assegno i dati da passare
                  if (homeworks.length == 0) {
                    counter++
                    if (counter == assignments.length) {
                      this.displayedAssignments = [...displayedAssignments]
                      this.displayedHomeworks = [...displayHomeworks]
                      this.isAllLoaded = true
                    }
                  }

                  // Per ogni hws
                  homeworks.forEach(homework => {

                    /*  unread,
                        read,
                        delivered,
                        reviewed */

                    // Variabile introdotta per venire incontro al problema relativo a ordinamento. 
                    // E' stata settata dal client perché il server manda un enum che viene interpretato come una stringa.
                    // La sua aassegnazione è stata usata a livello più basso per ordinare in base a policy di importanza
                    let rawState: number

                    // stao che viene visualizzato
                    let state = ""

                    // a seconda di quello che viene ricevuto assegnamo uno stato al dispayed hw
                    switch (homework.state) {
                      // se si trova anche solo un hw che risulta anche solo letto 
                      // allora l'assignment non può essere più cancellato
                      case "read":
                        state = "LETTO"
                        rawState = 1
                        displayedAssignment.isDeletable = false
                        break;
                      case "delivered":
                        state = "CONSEGNATO"
                        rawState = 4
                        displayedAssignment.isDeletable = false
                        break;
                      case "reviewed":
                        state = "RIVISTO"
                        rawState = 3
                        displayedAssignment.isDeletable = false
                        break;
                      default:
                        state = "NON LETTO"
                        rawState = 0
                        break;
                    }


                    // Definisci il voto da visualizzare
                    let mark = homework.mark === 0 ? "--" : homework.mark.toString()

                    //E' una valutazione finale?
                    if (homework.isFinal) {
                      //modifico stato a registrato
                      state = "REGISTRATO"
                      rawState = 2
                      // il voto è settato, definisco cosa visualizzare
                      mark = homework.mark < 18 ? "RESPINTO" : homework.mark.toString()
                    }


                    //Retrieve info about the corresponding student
                    let href = homework.links.find(link => link.rel === "student").href

                    if (href != "") {

                      // Prendo lo studente corrispondente all' hw
                      this.teacherService.getResourceByUrl(href).subscribe(element => {

                        // Aggiorno contatore hw perchè ho ritirato tutte le info utili relative allo stesso 
                        counterHw++

                        let student: Student = element

                        //Aggiungo displayed hw
                        displayHomeworks.push({
                          assignmentId: assignments[i].id,
                          homeworkId: homework.id,
                          name: student.name,
                          surname: student.firstName,
                          studentId: student.id,
                          state: state,
                          rawState: rawState,
                          isFinal: homework.isFinal,
                          mark: mark,
                          timestamp: new Date(homework.lastModified).toLocaleDateString(undefined, options),
                          timestampObj: new Date(homework.lastModified)
                        })

                        // Se sono arrivato alla fine degli hws per un assignment
                        if (homeworks.length == counterHw) {
                          // Un assignment è stato completato
                          counter++
                          // Se ho completato tutti gli assignment => assegno i dati
                          if (counter == assignments.length) {

                            let currentDate = new Date()
                            //sorto in base a policy temporale e di importanza
                            displayedAssignments = displayedAssignments.sort((a, b) => {

                              // a e b scaduti ordine inverso dal più recente al più vecchio
                              if (a.expirationDateObj.getTime() < currentDate.getTime() && b.expirationDateObj.getTime() < currentDate.getTime()) {
                                return b.expirationDateObj.getTime() - a.expirationDateObj.getTime()
                              } else
                                //nessuno dei due è scaduto // ordine temporale ascendente 
                                if (a.expirationDateObj.getTime() >= currentDate.getTime() && b.expirationDateObj.getTime() >= currentDate.getTime()) {
                                  return a.expirationDateObj.getTime() - b.expirationDateObj.getTime()
                                }
                                else {
                                  //uno dei due è scaduto, ritorno prima quello non scaduto
                                  if (a.expirationDateObj.getTime() < currentDate.getTime())
                                    return 1
                                  else return -1
                                }


                            })
                            // Aggiorno sources
                            this.displayedAssignments = [...displayedAssignments]
                            this.displayedHomeworks = [...displayHomeworks]
                            this.isAllLoaded = true // passo i dati a componente sottostante
                          }
                        }
                      })
                    }
                  })
                }, error => this.isAllLoaded = true)
              })
            }
          } else {
            this.isAllLoaded = true
          }
        }, error => {
          this.router.navigate(['PageNotFound'])
        });
      }
    })
  }

}
