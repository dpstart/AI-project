import { Component, OnInit } from '@angular/core';

import { Student } from '../student.model';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { StudentService } from '../services/student.service';
import { ActivatedRoute } from '@angular/router';


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

  course;


  constructor(private http: HttpClient, private service: StudentService, private route: ActivatedRoute) {
    // this.getJSON(this._jsonURLenrolled).subscribe(data => {
    //   this.enrolledStudents.data = data;
    // });
  }


  ngOnInit() {

    this.course = this.route.snapshot.params['course_name'];


    this.service.getStudentsInCourse<Student[]>(this.course).subscribe(data => {
      this.allStudents = data;
      this.isAllStudentsLoaded = true;
    });


    this.service.getStudentsInCourse<Student[]>(this.course).subscribe(data => {
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
