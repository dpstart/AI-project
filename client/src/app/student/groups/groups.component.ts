import { Component, OnInit } from '@angular/core';
import { StudentService } from 'src/app/services/student.service';
import { Observable } from 'rxjs';
import { Student } from 'src/app/model/student.model';
import { MatTableDataSource } from '@angular/material/table';

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

  //Table related pproperties
  displayedColumns: string[] = ['id', 'name', 'first name', 'group'];
  dataSourceStudentsInTeam: MatTableDataSource<Student> = new MatTableDataSource<Student>();
  expandedElement: Student | null;

  constructor(private _studentService: StudentService) { this.studentsInTeam = [] }

  ngOnInit(): void {
    this.studentService.getTeamsOfStudent().subscribe(
      (data) => {
        this.studentsInTeam = data
      })
  }
  
}
