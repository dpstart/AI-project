import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouteStateService } from 'src/app/services/route-state.service';
import { TeacherService } from 'src/app/services/teacher.service';
import { Assignment } from 'src/app/model/assignment.model';
import { Homework, states } from 'src/app/model/homework.model';
import { DisplayedHomework } from 'src/app/shared-components/homework/homework.component';

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
          let date = new Date().toDateString()
          assignments.push(new Assignment(1, date.toString(), date.toString()))

          assignments.forEach(assignment => {

            this.teacherService.getHomeworksByAssignment(this.selectedCourse, assignment.id).subscribe((homeworks: Homework[]) => {

              //******************************TODO: remove fake homeworks***************************************//
              homeworks.push(new Homework(1, states.delivered, false, 25))


              let displayHomeworks: DisplayedHomework[] = []

              /*  unread,
                  read,
                  delivered,
                  reviewed */

              homeworks.forEach(element => {
                let state = ""
                switch (element.state) {
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
                displayHomeworks.push({
                  id: element.id,
                  state: state,
                  isFinal: element.isFinal,
                  mark: element.mark
                })
              })

              this.assignments = assignments
              this.displayedHomeworks = displayHomeworks
              this.isAllLoaded = true
              console.log(this.assignments,this.displayedHomeworks)
            },

              //***************REMOVE THIS BRANCH **************************************/
              (error) => {
                //TODO: remove fake homeworks
                let homeworks: Homework[] = []

                homeworks.push(new Homework(1, states.delivered, false, 25))
                let displayHomeworks: DisplayedHomework[] = []

                homeworks.forEach(element => {
                  let state = ""
                  switch (element.state) {
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

                  displayHomeworks.push({
                    id: element.id,
                    state: state,
                    isFinal: element.isFinal,
                    mark: element.mark
                  })
                })

                this.assignments = assignments
                this.displayedHomeworks = displayHomeworks
                this.isAllLoaded = true
                console.log(this.assignments,this.displayedHomeworks)

              })
          })
        });
      }

    })

  }

}
