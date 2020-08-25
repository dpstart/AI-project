import { Component, OnInit, Inject } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { StudentService } from 'src/app/services/student.service';
import { RouteStateService } from 'src/app/services/route-state.service';
import { HomeworkVersion } from 'src/app/model/homework-version';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Homework } from 'src/app/model/homework.model';
import { Assignment } from 'src/app/model/assignment.model';
import { TeacherService } from 'src/app/services/teacher.service';
import { version } from 'process';

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

  constructor(private teacherService: TeacherService, private routeStateService: RouteStateService,
    @Inject(MAT_DIALOG_DATA) public data) {

    this.selectedAssignment = data.assignment
    this.selectedHomework = data.homework
    this.historyHomeworkColumnsToDisplay = ['id', 'image', 'deliveryDate']
    this.historyHomeworkDataSource = new MatTableDataSource<HomeworkVersion>()
  }




  ngOnInit(): void {

    this.routeStateService.pathParam.subscribe(courseName => {
      this.courseName = courseName
    })


    this.teacherService.getHomeworkVersions(this.courseName, this.selectedAssignment.id, this.selectedHomework.id).subscribe((data) => {

      data.push(new HomeworkVersion(1, "ciao", new Date()))

      /*this.httpClient.get('http://localhost:8080/image/get/' + this.imageName)
      .subscribe(
        res => {
          this.retrieveResonse = res;
          this.base64Data = this.retrieveResonse.picByte;
          this.retrievedImage = 'data:image/jpeg;base64,' + this.base64Data;
        }
      );
  }*/

      this.historyHomeworkDataSource.data = data.map(element => {
        // this.base64Data = this.retrieveResonse.picByte;
        element.content = 'data:image/jpeg;base64,' + element.content
        return element
      })


      this.historyHomeworkDataSource.data = [...data]
    })
  }


}
