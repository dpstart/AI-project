import { Component, OnInit } from '@angular/core';
import { RouteStateService } from 'src/app/services/route-state.service';
import { ActivatedRoute } from '@angular/router';
import { DisplayedHomework } from 'src/app/shared-components/homework/homework.component';
import { Assignment } from 'src/app/model/assignment.model';
import { TeacherService } from 'src/app/services/teacher.service';
import { Homework, states } from 'src/app/model/homework.model';
import { StudentService } from 'src/app/services/student.service';
import { AuthService } from 'src/app/services/auth.service';
import { Student } from 'src/app/model/student.model';

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
        this.studentService.getAssignmentByCourse(this.selectedCourse).subscribe((assignments: Assignment[]) => {

          this.assignments = assignments
          this.displayedHomeworks = []

          assignments.forEach(assignment => {

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
                      homeworkId: homework.id,
                      name: student.name,
                      surname: student.firstName,
                      freshman: student.id,
                      state: state,
                      timestamp: Date.now().toLocaleString()
                    })
                    this.assignments = assignments
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
