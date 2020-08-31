import { Component, OnInit } from '@angular/core';
import { RouteStateService } from 'src/app/services/route-state.service';
import { ActivatedRoute } from '@angular/router';
import { DisplayedHomework } from 'src/app/shared-components/homework/homework.component';
import { Assignment } from 'src/app/model/assignment.model';
import { TeacherService } from 'src/app/services/teacher.service';
import { Homework, states } from 'src/app/model/homework.model';
import { StudentService } from 'src/app/services/student.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-homework-student',
  templateUrl: './homework-student.component.html',
  styleUrls: ['./homework-student.component.css']
})
export class HomeworkStudentComponent implements OnInit {

  courseName: string
  selectedCourse: string

  displayedHomeworks: DisplayedHomework[];
  assignments: Assignment[]


  isAllLoaded: boolean


  constructor(
    private activatedRoute: ActivatedRoute,
    private routeStateService: RouteStateService,
    private studentService: StudentService,
    private authService: AuthService
  ) {
    this.isAllLoaded = false
  }

  ngOnInit(): void {

    this.activatedRoute.params.subscribe((params) => {
      if (params['course_name']) {
        this.routeStateService.updatePathParamState(params['course_name'])

        this.selectedCourse = params['course_name']


        //TODO le richieste falliscono perchè non esistono gli url
        this.studentService.getAssignmentByCourse().subscribe((assignments: Assignment[]) => {
          let date = new Date().toDateString()
          assignments.push(new Assignment(1, date.toString(), date.toString()))

          this.assignments = assignments
          this.displayedHomeworks = []

          assignments.forEach(assignment => {

            this.studentService.getHomeworksByAssignment(this.selectedCourse, assignment.id).subscribe((homeworks: Homework[]) => {

              //******************************TODO: remove fake homeworks***************************************//
              homeworks.push(new Homework(1, states.delivered, false, 25))


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

                // this.teacherService.getStudentIdByHomework(this.selectedCourse, assignment.id, homework.id).subscribe(matricola => {
                //   this.teacherService.getStudentById(matricola).subscribe(student => {
                //   })
                // })

                displayHomeworks.push({
                  name: "student.name",
                  surname: "student.firstName",
                  freshman: "student.id",
                  state: state,
                  timestamp: Date.now().toLocaleString()
                })
                this.assignments = assignments
                this.displayedHomeworks = displayHomeworks
                this.isAllLoaded = true
                console.log(this.assignments, this.displayedHomeworks)
              })
            },

              //***************REMOVE THIS BRANCH **************************************/
              (error) => {
                //TODO: remove fake homeworks
                let homeworks: Homework[] = []

                homeworks.push(new Homework(1, states.delivered, false, 25))
                let displayHomeworks: DisplayedHomework[] = []

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


                  //TODO per il momento i dati sono fake è da vedere come ricavarli
                  // this.teacherService.getStudentIdByHomework(this.selectedCourse, assignment.id, homework.id).subscribe(matricola => {
                  //   this.teacherService.getStudentById(matricola).subscribe(student => {
                  //   })
                  // })

                  displayHomeworks.push({
                    name: "student.name",
                    surname: "student.firstName",
                    freshman: "student.id",
                    state: state,
                    timestamp: new Date().toLocaleString()
                  })
                  this.assignments = assignments
                  this.displayedHomeworks = displayHomeworks
                  this.isAllLoaded = true
                  console.log(this.assignments, this.displayedHomeworks)
                  console.log("ERRORE");


                })
              })
          })
        });
      }

    })

  }

}
