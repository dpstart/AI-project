import { Component, OnInit } from '@angular/core';

import { Student } from '../student.model';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { StudentService } from '../services/student.service';


@Component({
  selector: 'app-students-cont',
  templateUrl: './students-cont.component.html',
  styleUrls: ['./students-cont.component.css']
})
export class StudentsContComponent implements OnInit {

  isAllStudentsLoaded: boolean = false;
  isEnrolledStudentsLoaded: boolean = false;

  // Data sources
  allStudents: Student[];
  enrolledStudents: Student[];

  studentsToDelete: Student[];

  // This is a mock element. Ideally, this would be passwd by the parent component or through proper routing.
  course = {
    id: 1,
    name: "Applicazioni Internet",
    path: "applicazioni-internet"
  };


  constructor(private http: HttpClient, private service: StudentService) {
    // this.getJSON(this._jsonURLenrolled).subscribe(data => {
    //   this.enrolledStudents.data = data;
    // });
  }

  ngOnInit() {

    this.service.getStudentsInCourse<Student[]>(0).subscribe(data => {
      this.allStudents = data;
      this.isAllStudentsLoaded = true;
    });


    this.service.getStudentsInCourse<Student[]>(this.course.id).subscribe(data => {
      this.enrolledStudents = data;
      this.isEnrolledStudentsLoaded = true;
    });

  }

  addStudent(s: Student) {

    if (this.enrolledStudents.indexOf(s) != -1)
      return;

    this.service
      .addStudent(s)
      .subscribe(s => {
        s.courseId = this.course.id;
        var data = this.enrolledStudents;
        data.push(s);
        this.enrolledStudents = [].concat(data);

      })

  }

  deleteStudents(students: Student[]) {

    students.forEach(s => {
      this.service.deleteStudent(s.id).subscribe(_ =>
        this.enrolledStudents = this.enrolledStudents.filter(s2 => s2.id != s.id)
      );
    });

  }

  public getJSON(path): Observable<any> {
    return this.http.get(path);
  }

}
