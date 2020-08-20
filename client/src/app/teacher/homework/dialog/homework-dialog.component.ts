import { Component, OnInit, Inject } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { StudentService } from 'src/app/services/student.service';
import { RouteStateService } from 'src/app/services/route-state.service';
import { HomeworkVersion } from 'src/app/model/homework-version';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Homework } from 'src/app/model/homework.model';
import { Assignment } from 'src/app/model/assignment.model';

@Component({
  selector: 'app-homework-dialog',
  templateUrl: './homework-dialog.component.html',
  styleUrls: ['./homework-dialog.component.css']
})
export class HomeworkDialogComponent implements OnInit {

  historyHomeworkDataSource: MatTableDataSource<HomeworkVersion>
  historyHomeworkColumnsToDisplay: string[]

  courseName: string
  selectedAssignment: Assignment
  selectedHomework: Homework

  constructor(private studentService: StudentService, private routeStateService: RouteStateService,
    @Inject(MAT_DIALOG_DATA) public data) {

    this.selectedAssignment = data.assignment
    this.selectedHomework = data.homework
    this.historyHomeworkColumnsToDisplay = ['id','image','deliveryDate']
    this.historyHomeworkDataSource = new MatTableDataSource<HomeworkVersion>()
  }




  ngOnInit(): void {

    this.routeStateService.pathParam.subscribe(courseName => {
      this.courseName = courseName
    })


    // this.studentService.getHomeworkVersions(this.courseName, this.selectedAssignment.id, this.selectedHomework.id,).subscribe(
    //   (homeworkVersion: HomeworkVersion[]) => {

    //     homeworkVersion.push(new HomeworkVersion(1, "ciao", new Date()))
    //     this.historyHomeworkDataSource.data = [...homeworkVersion]
    //   })

    let homeworkVersion = []
       homeworkVersion.push(new HomeworkVersion(1, "ciao", new Date()))
        this.historyHomeworkDataSource.data = [...homeworkVersion]

  }


}
