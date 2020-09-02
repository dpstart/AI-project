import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouteStateService } from 'src/app/services/route-state.service';
import { TeacherService } from 'src/app/services/teacher.service';
import { Assignment } from 'src/app/model/assignment.model';
import { Homework, states } from 'src/app/model/homework.model';
import { DisplayedHomework } from 'src/app/shared-components/homework/homework.component';
import { Student } from 'src/app/model/student.model';

@Component({
  selector: 'app-homework-container',
  templateUrl: './homework-container.component.html',
  styleUrls: ['./homework-container.component.css']
})
export class HomeworkContainerComponent implements OnInit {


  courseName: string
  selectedCourse: string

  displayedHomeworks: DisplayedHomework[];
  assignments: Assignment[]


  isAllLoaded: boolean


  constructor(
    private activatedRoute: ActivatedRoute,
    private routeStateService: RouteStateService,
    private teacherService: TeacherService
  ) {
    this.isAllLoaded = false
  }

  ngOnInit(): void {

  
    this.activatedRoute.params.subscribe((params) => {
      if (params['course_name']) {
        this.routeStateService.updatePathParamState(params['course_name'])

        this.selectedCourse = params['course_name']

        this.teacherService.getAssignmentsByCourse(this.selectedCourse).subscribe((assignments: Assignment[]) => {

          assignments.forEach(assignment => {

            this.teacherService.getHomeworksByAssignment(this.selectedCourse, assignment.id).subscribe((homeworks: Homework[]) => {

              console.log(homeworks);


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
                  this.teacherService.getResourceByUrl(href).subscribe(element => {


                    console.log(element);
                    
                    let student: Student = element

                    displayHomeworks.push({
                      homeworkId:homework.id,
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
