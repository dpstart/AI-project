import { Component, OnInit } from '@angular/core';
import { RouteStateService } from 'src/app/services/route-state.service';
import { ActivatedRoute } from '@angular/router';
import { DisplayedHomework, DisplayedAssignment } from 'src/app/shared-components/homework/homework.component';
import { Assignment } from 'src/app/model/assignment.model';
import { Homework, states } from 'src/app/model/homework.model';
import { StudentService } from 'src/app/services/student.service';
import { Student } from 'src/app/model/student.model';


const options = { year: 'numeric', month: 'numeric', day: 'numeric' };

@Component({
  selector: 'app-homework-student',
  templateUrl: './homework-student.component.html',
  styleUrls: ['./homework-student.component.css']
})
export class HomeworkStudentComponent implements OnInit {

  courseName: string
  selectedCourse: string

  displayedHomeworks: DisplayedHomework[];
  displayedAssignments: DisplayedAssignment[]


  isAllLoaded: boolean


  constructor(
    private activatedRoute: ActivatedRoute,
    private routeStateService: RouteStateService,
    private studentService: StudentService,
  ) {
    this.isAllLoaded = false
  }

  ngOnInit(): void {

    this.activatedRoute.params.subscribe((params) => {
      if (params['course_name']) {
        this.routeStateService.updatePathParamState(params['course_name'])

        this.selectedCourse = params['course_name']


        //TODO le richieste falliscono perchè non esistono gli url
        this.studentService.getAssignmentByCourse(this.selectedCourse).subscribe((assignments: Assignment[]) => {


          //New Source
          let displayedAssignments: DisplayedAssignment[] = []

          this.displayedHomeworks = []

          assignments.forEach(assignment => {

            console.log(new Date(assignment.releaseDate));

            //convertion to displayed assignment
            let displayedAssignment: DisplayedAssignment = {
              id: assignment.id,
              releaseDate: new Date(assignment.releaseDate).toLocaleDateString(undefined, options),
              expirationDate: new Date(assignment.expirationDate).toLocaleDateString(undefined, options)
            }
            //add converted element to assignment source
            displayedAssignments.push(displayedAssignment)


            this.studentService.getHomeworksByAssignment(this.selectedCourse, assignment.id).subscribe((homeworks: Homework[]) => {

              let displayHomeworks: DisplayedHomework[] = []

              /*  unread,
                  read,
                  delivered,
                  reviewed */

              homeworks.forEach(homework => {
                let state = ""
                switch (homework.state) {
                  case 1:
                    state = "LETTO"
                    break;
                  case 2:
                    state = "CONSEGNATO"
                    break;
                  case 3:
                    state = "RIVISTO"
                    break;

                  default:
                    state = "NON LETTO"
                    break;

                }



                //Retrieve info about the corresponding student

                let href = ""
                homework.links.forEach(link => {
                  if (link.rel === "student")
                    href = link.href
                });


                if (href != "") {
                  this.studentService.getResourceByUrl(href).subscribe(element => {


                    console.log(element);

                    let student: Student = element

                    displayHomeworks.push({
                      assignmentId: assignment.id,
                      homeworkId: homework.id,
                      name: student.name,
                      surname: student.firstName,
                      freshman: student.id,
                      state: state,
                      timestamp: new Date().toLocaleDateString(undefined, options) // TODO settare data coerentemente con stato
                    })
                    this.displayedAssignments = displayedAssignments
                    this.displayedHomeworks = displayHomeworks
                    this.isAllLoaded = true
                    //  console.log(this.assignments, this.displayedHomeworks)
                  })
                }

              })
            })
          })
        });
      }

    })

  }

}
