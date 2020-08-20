import { Component, OnInit } from '@angular/core';

import { Student } from '../model/student.model';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { StudentService } from '../services/student.service';
import { ActivatedRoute } from '@angular/router';
import { TeacherService } from '../services/teacher.service';
import { RouteStateService } from '../services/route-state.service';


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

  selectedCourse: string
  course;

  constructor(private http: HttpClient, private studentService: StudentService, private activatedRoute: ActivatedRoute, private routeStateService: RouteStateService, private teacherService: TeacherService) {
    // this.getJSON(this._jsonURLenrolled).subscribe(data => {
    //   this.enrolledStudents.data = data;
    // });
  }


  ngOnInit() {



    this.activatedRoute.params.subscribe(params => {
      if (params["course_name"]) {

        this.routeStateService.updatePathParamState(params['course_name'])


        this.selectedCourse = params["course_name"];



        this.studentService.getStudentsInCourse(this.selectedCourse).subscribe(data => {
          this.allStudents = data;
          this.isAllStudentsLoaded = true;
          this.enrolledStudents = data;
          this.isEnrolledStudentsLoaded = true;
        });
      }
    })

  }

  addStudent(student: Student) {

    if (this.enrolledStudents.indexOf(student) != -1)
      return;

    this.studentService
      .addStudent(student)
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
