import { Component, OnInit } from '@angular/core';

import { Student } from '../model/student.model';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { StudentService } from '../services/student.service';
import { ActivatedRoute } from '@angular/router';
import { TeacherService } from '../services/teacher.service';


@Component({
  selector: 'app-students-cont',
  templateUrl: './students-cont.component.html',
  styles: [``]
})
export class StudentsContComponent implements OnInit {

  isAllStudentsLoaded: boolean = false;
  isEnrolledStudentsLoaded: boolean = false;

  // Data sources
  allStudents: Student[];
  enrolledStudents: Student[];
  studentsToDelete: Student[];

  course;


  constructor(private http: HttpClient, private studentService: StudentService, private activatedRoute: ActivatedRoute, private teacherService: TeacherService) {
    // this.getJSON(this._jsonURLenrolled).subscribe(data => {
    //   this.enrolledStudents.data = data;
    // });
  }


  ngOnInit() {

    this.activatedRoute.params.subscribe(params => {
      if (params["course_name"]) {
        let course = params["course_name"];

        this.teacherService.setSelectedCourse(course);


        this.studentService.getStudentsInCourse(course).subscribe(data => {
          this.allStudents = data;
          this.isAllStudentsLoaded = true;
        });


        this.studentService.getStudentsInCourse(course).subscribe(data => {
          this.enrolledStudents = data;
          this.isEnrolledStudentsLoaded = true;
        });
      }
    })

  }

  addStudent(s: Student) {

    if (this.enrolledStudents.indexOf(s) != -1)
      return;

    this.studentService
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
      this.studentService.deleteStudent(s.id).subscribe(_ =>
        this.enrolledStudents = this.enrolledStudents.filter(s2 => s2.id != s.id)
      );
    });

  }

  public getJSON(path): Observable<any> {
    return this.http.get(path);
  }

}
