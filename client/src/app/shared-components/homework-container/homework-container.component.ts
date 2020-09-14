import { Component, OnInit } from '@angular/core';
import { DisplayedHomework, DisplayedAssignment } from '../homework/homework.component';
import { ActivatedRoute } from '@angular/router';
import { RouteStateService } from 'src/app/services/route-state.service';
import { TeacherService } from 'src/app/services/teacher.service';
import { Assignment } from 'src/app/model/assignment.model';
import { Homework } from 'src/app/model/homework.model';
import { Student } from 'src/app/model/student.model';
import { Image } from 'src/app/model/image.model';
import { DomSanitizer } from '@angular/platform-browser';
import { timestamp } from 'rxjs/operators';


const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' };

@Component({
  selector: 'app-homework-container',
  templateUrl: './homework-container.component.html',
  styleUrls: ['./homework-container.component.css']
})
export class HomeworkContainerComponent implements OnInit {


  courseName: string
  selectedCourse: string

  displayedHomeworks: DisplayedHomework[];
  displayedAssignments: DisplayedAssignment[]


  isAllLoaded: boolean


  constructor(
    private activatedRoute: ActivatedRoute,
    private routeStateService: RouteStateService,
    private teacherService: TeacherService,
    private sanitizer: DomSanitizer,
  ) {
    this.displayedAssignments = []
    this.displayedHomeworks = []
    this.isAllLoaded = false
  }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params) => {
      if (params['course_name']) {
        this.routeStateService.updatePathParamState(params['course_name'])

        this.selectedCourse = params['course_name']


        this.teacherService.getAssignmentsByCourse(this.selectedCourse).subscribe((assignments: Assignment[]) => {

          //New Source
          let displayedAssignments: DisplayedAssignment[] = []


          let displayHomeworks: DisplayedHomework[] = []

          let counter = 0


          if (assignments.length != 0) {
            for (let i = 0; i < assignments.length; i++) {

              this.teacherService.getResourceByUrl(assignments[i].links.find(link => link.rel === "image").href).subscribe((success: Image) => {

                let base64Data = success.picByte;
                let formattedImage = `data:${success.type};base64,` + '\n' + base64Data;
                let imagesrc = this.sanitizer.bypassSecurityTrustResourceUrl(formattedImage);

                //convertion to displayed assignment
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



                  if (homeworks.length == 0) {
                    counter++
                    if (counter == assignments.length) {
                      this.displayedAssignments = [...displayedAssignments]
                      this.displayedHomeworks = [...displayHomeworks]
                      this.isAllLoaded = true
                    }
                  }

                  homeworks.forEach(homework => {

                    /*  unread,
                        read,
                        delivered,
                        reviewed */

                    let rawState: number
                    let state = ""
                    switch (homework.state) {
                      // se si trova anche solo un hw che risulta anche solo letto allora l'assignment non può essere più cancellato
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


                    // Definisci il voto
                    let mark = homework.mark === 0 ? "--" : homework.mark.toString()



                    //E' una valutazione finale?
                    if (homework.isFinal) {
                      state = "REGISTRATO"
                      rawState = 2
                      mark = homework.mark < 18 ? "RESPINTO" : homework.mark.toString()
                    }


                    //Retrieve info about the corresponding student

                    let href = homework.links.find(link => link.rel === "student").href


                    if (href != "") {
                      this.teacherService.getResourceByUrl(href).subscribe(element => {
                        counterHw++

                        let student: Student = element

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

                        if (homeworks.length == counterHw) {
                          counter++
                          if (counter == assignments.length) {

                            let currentDate = new Date()
                            displayedAssignments = displayedAssignments.sort((a, b) => {

                              if (a.expirationDateObj.getTime() < currentDate.getTime() && b.expirationDateObj.getTime() < currentDate.getTime()) {
                                // a e b scaduti ordine inverso dal più recente al più vecchio
                                return b.expirationDateObj.getTime() - a.expirationDateObj.getTime()
                              } else
                                if (a.expirationDateObj.getTime() >= currentDate.getTime() && b.expirationDateObj.getTime() >= currentDate.getTime()) {
                                  //nessuno dei due è scaduto //ordine temporale ascendente 
                                  return a.expirationDateObj.getTime() - b.expirationDateObj.getTime()
                                }
                                else {
                                  //uno dei due è scaduto, ritorno prima quello non scaduto
                                  if (a.expirationDateObj.getTime() < currentDate.getTime())
                                    return 1
                                  else return -1
                                }


                            })
                            this.displayedAssignments = [...displayedAssignments]
                            this.displayedHomeworks = [...displayHomeworks]
                            this.isAllLoaded = true
                          }
                        }
                        // le chiamate vengono fatte sequenzialmente per ogni homework => solo quando sono caricati tutti vengono visualizzati
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
          this.isAllLoaded = true
        });
      }
    })
  }

}
