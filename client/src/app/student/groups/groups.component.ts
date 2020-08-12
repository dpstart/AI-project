import { Component, OnInit } from '@angular/core';
import { StudentService } from 'src/app/services/student.service';
import { Observable } from 'rxjs';
import { Student } from 'src/app/model/student.model';
import { MatTableDataSource } from '@angular/material/table';
import { Router, ActivatedRoute } from '@angular/router';
import { TeacherService } from 'src/app/services/teacher.service';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css']
})
export class GroupsComponent implements OnInit {



  public get studentService(): StudentService {
    return this._studentService;
  }

  studentsInTeam: Student[];
  course: string

  //Table related pproperties

  dataSourceStudentsInTeam: MatTableDataSource<Student>
  dataSourceStudentsNotYetInTeam: MatTableDataSource<Student>
  displayedColumns: string[]
  expandedElement: Student | null;

  constructor(private router: ActivatedRoute, private _studentService: StudentService, private teacherService: TeacherService) {

    this.course = ""
    this.studentsInTeam = []
    this.dataSourceStudentsInTeam = new MatTableDataSource<Student>();


    this.dataSourceStudentsNotYetInTeam = new MatTableDataSource<Student>();
    this.displayedColumns = ['id', 'name', 'first name', 'group'];


  }

  ngOnInit(): void {
    this.router.params.subscribe(params => {
      if (params["course_name"]) {
        this.course = params["course_name"];
      }
    })

    this.studentService.getTeamsOfStudent().subscribe(
      (data) => {
        this.studentsInTeam = data

        //Now we can see if the student is already in team or not by looking to the length of the studentsInTeam array:
        if (this.studentsInTeam.length == 0) {
          //students is not yet in team: we have to upload in the table only the students that are not in a team

          this.studentService.getStudentsAvailableInCourse(this.course).subscribe((studentsNotInTeam:Student[]) => {
            this.dataSourceStudentsNotYetInTeam= new MatTableDataSource<Student>(studentsNotInTeam)
          })
        }


      })
  }

}
