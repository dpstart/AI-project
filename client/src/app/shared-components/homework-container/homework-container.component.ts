import { Component, OnInit } from '@angular/core';
import { DisplayedHomework, DisplayedAssignment } from '../homework/homework.component';
import { ActivatedRoute } from '@angular/router';
import { RouteStateService } from 'src/app/services/route-state.service';
import { TeacherService } from 'src/app/services/teacher.service';
import { Assignment } from 'src/app/model/assignment.model';
import { Homework } from 'src/app/model/homework.model';
import { Student } from 'src/app/model/student.model';


const options = { year: 'numeric', month: 'numeric', day: 'numeric' };

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
    private teacherService: TeacherService
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

              //convertion to displayed assignment
              let displayedAssignment: DisplayedAssignment = {
                id: assignments[i].id,
                releaseDate: new Date(assignments[i].releaseDate).toLocaleDateString(undefined, options),
                expirationDate: new Date(assignments[i].expirationDate).toLocaleDateString(undefined, options)
              }
              //add converted element to assignment source
              displayedAssignments.push(displayedAssignment)

              //get homeworks that corresponds to assignment
              this.teacherService.getHomeworksByAssignment(this.selectedCourse, assignments[i].id).subscribe((homeworks: Homework[]) => {

                let counterHw = 0

                homeworks.forEach(homework => {
                  /*  unread,
                      read,
                      delivered,
                      reviewed */
                  let state = ""
                  switch (homework.state) {
                    case "read":
                      state = "LETTO"
                      break;
                    case "delivered":
                      state = "CONSEGNATO"
                      break;
                    case "reviewed":
                      state = "RIVISTO"
                      break;
                    default:
                      state = "NON LETTO"
                      break;
                  }


                  if (homework.isFinal)
                    state = "REGISTRATO"

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
                        isFinal: homework.isFinal,
                        mark: homework.mark === 0 ? "--" : homework.mark.toString(),
                        timestamp: new Date().toLocaleDateString(undefined, options) // TODO: il formato è giusto la data no.
                      })

                      if (homeworks.length == counterHw) {
                        counter++
                        if (counter == assignments.length) {
                          this.displayedAssignments = [...displayedAssignments]
                          this.displayedHomeworks = [...displayHomeworks]
                          this.isAllLoaded = true
                          console.log(this.displayedAssignments, this.displayedHomeworks);

                        }
                      }
                      // le chiamate vengono fatte sequenzialmente per ogni homework => solo quando sono caricati tutti vengono visualizzati
                    })
                  }
                })
              })
            }
          } else {
            this.isAllLoaded = true
          }
        });
      }
    })
  }

}
