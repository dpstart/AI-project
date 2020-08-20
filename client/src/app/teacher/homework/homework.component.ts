import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Homework, states } from 'src/app/model/homework.model';
import { TeacherService } from 'src/app/services/teacher.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Assignment } from 'src/app/model/assignment.model';
import { ActivatedRoute } from '@angular/router';
import { RouteStateService } from 'src/app/services/route-state.service';

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

  // id,  state,  isFinal, mark
  homeworksColumnsToDisplay: string[] = ['id', 'state', 'isFinal', 'mark'];
  homeworksDataSource: MatTableDataSource<Homework> = new MatTableDataSource<Homework>();


  consegneDisplayedColumns: string[] = ['id', 'releaseDate', 'expirationDate']
  consegneDataSource: MatTableDataSource<Assignment> = new MatTableDataSource<Assignment>();


  assignmentExpandedElement: Assignment | null;

  homeworkExpandedElement: Homework | null;

  constructor(private teacherService: TeacherService, private activatedRoute: ActivatedRoute, private routeStateService: RouteStateService) { }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params) => {
      if (params['course_name']) {
        this.routeStateService.updatePathParamState(params['course_name'])

        this.selectedCourse = params['course_name']

        this.teacherService.getAssignmentsByCourse(this.selectedCourse).subscribe((assignments: Assignment[]) => {
          assignments.push(new Assignment(1, new Date().toDateString(), new Date().toDateString()))
          this.consegneDataSource = new MatTableDataSource<Assignment>(assignments)


          assignments.forEach(assignment => {

            this.teacherService.getHomeworksByAssignment(this.selectedCourse, assignment.id).subscribe((homeworks: Homework[]) => {

              //TODO: remove fake homeworks
              homeworks.push(new Homework(1, states.delivered, false, 25))
              this.homeworksDataSource = new MatTableDataSource<Homework>(homeworks)
            }, (data) => {

              //TODO: remove fake homeworks
              let homeworks: Homework[] = []
              homeworks.push(new Homework(1, states.delivered, false, 25))
              this.homeworksDataSource = new MatTableDataSource<Homework>(homeworks)
            })

            // this.teacherService.getHomeworks(this.teacherService.getSelectedCourse()).subscribe((homeworks: Homework[]) => {

            //   //TODO: remove fake homeworks
            //   homeworks.push(new Homework(1, states.delivered, false, 25))
            //   this.dataSource = new MatTableDataSource<Homework>(homeworks)
            // })
          })
        });
      }

    })


  }
  seeHomeworkDetails(element) {
    console.log(element)
  }
}

