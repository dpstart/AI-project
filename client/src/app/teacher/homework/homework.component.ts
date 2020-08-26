import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Homework, states } from 'src/app/model/homework.model';
import { TeacherService } from 'src/app/services/teacher.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Assignment } from 'src/app/model/assignment.model';
import { ActivatedRoute } from '@angular/router';
import { RouteStateService } from 'src/app/services/route-state.service';
import { MatDialog } from '@angular/material/dialog';
import { HomeworkDialogComponent } from './dialog/homework-dialog.component';
import { element } from 'protractor';

export interface DisplayedHomework {
  id: number,
  state: string,
  isFinal: boolean,
  mark: number
}



@Component({
  selector: 'app-homework',
  templateUrl: './homework.component.html',
  styleUrls: ['./homework.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})
export class HomeworkComponent implements OnInit {


  selectedCourse: string

  selectedAssignment: Assignment

  // id,  state,  isFinal, mark
  homeworksColumnsToDisplay: string[] = ['id', 'state', 'isFinal', 'mark'];
  homeworksDataSource: MatTableDataSource<DisplayedHomework> = new MatTableDataSource<DisplayedHomework>();


  consegneDisplayedColumns: string[] = ['id', 'releaseDate', 'expirationDate']
  consegneDataSource: MatTableDataSource<Assignment> = new MatTableDataSource<Assignment>();


  assignmentExpandedElement: Assignment | null;

  homeworkExpandedElement: Homework | null;

  constructor(private teacherService: TeacherService, private activatedRoute: ActivatedRoute,
    private routeStateService: RouteStateService, private dialog: MatDialog) { }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params) => {
      if (params['course_name']) {
        this.routeStateService.updatePathParamState(params['course_name'])

        this.selectedCourse = params['course_name']

        this.teacherService.getAssignmentsByCourse(this.selectedCourse).subscribe((assignments: Assignment[]) => {
          let date = new Date().toDateString()
          assignments.push(new Assignment(1, date.toString(), date.toString()))
          this.consegneDataSource = new MatTableDataSource<Assignment>(assignments)


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

              this.homeworksDataSource.data = displayHomeworks
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

                this.homeworksDataSource.data = displayHomeworks

              })
          })
        });
      }

    })


  }

  selectAssignment(assignment: Assignment) {
    //assignmentExpandedElement === assignment ? null : assignment
    console.log("assignment: ", assignment)
    this.selectedAssignment = assignment
  }
  seeHomeworkDetails(homework: Homework) {

    const dialogRef = this.dialog.open(HomeworkDialogComponent, {
      height: '95%',
      width: '95%',
      data: {
        assignment: this.assignmentExpandedElement,
        homework: homework
      }
    });
    event.stopPropagation();
  }

}





