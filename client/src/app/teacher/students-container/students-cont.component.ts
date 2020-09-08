import { Component, OnInit } from '@angular/core';
import { Student } from '../../model/student.model';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { StudentService } from '../../services/student.service';
import { ActivatedRoute } from '@angular/router';
import { RouteStateService } from '../../services/route-state.service';


@Component({
  selector: 'app-students-cont',
  templateUrl: './students-cont.component.html',
  styles: [
    `mat-spinner{
    margin: 4%;
}`]
})
export class StudentsContComponent implements OnInit {

  isAllStudentsLoaded: boolean = false;
  isEnrolledStudentsLoaded: boolean = false;

  // Data sources
  studentsNotInCourse: Student[];
  enrolledStudents: Student[];

  studentsToDelete: Student[];

  selectedCourse: string


  constructor(
    private http: HttpClient,
    private studentService: StudentService,
    private activatedRoute: ActivatedRoute,
    private routeStateService: RouteStateService) {
    // this.getJSON(this._jsonURLenrolled).subscribe(data => {
    //   this.enrolledStudents.data = data;
    // });
  }


  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      if (params["course_name"]) {

        this.routeStateService.updatePathParamState(params['course_name'])


        this.selectedCourse = params["course_name"];



        this.studentService.getStudentsInCourse(this.selectedCourse).subscribe(enrolledStudents => {
          this.enrolledStudents = enrolledStudents;

          this.studentService.getStudents().subscribe(allStudents => {

            let allStudentsNotInCourse = []

            for (let student of allStudents) {
              if (this.enrolledStudents.findIndex(x => student.id === x.id) == -1)
                allStudentsNotInCourse.push(student)
            }

            this.studentsNotInCourse = allStudentsNotInCourse
            this.isAllStudentsLoaded = true;
            this.isEnrolledStudentsLoaded = true;
          })

        });
      }
    })

  }

  addStudent(student: Student) {

    if (this.enrolledStudents.indexOf(student) != -1)
      return;

    this.studentService
      .enrollOne(this.selectedCourse, student.id)
      .subscribe(success => {
        var data = this.enrolledStudents;
        data.push(student);
        this.enrolledStudents = [].concat(data);
        console.log("before", this.studentsNotInCourse);
        //remove from all students not in course
        this.studentsNotInCourse = this.studentsNotInCourse.filter(s => s.id != student.id)
        console.log("after", this.studentsNotInCourse);

      })

  }

  deleteStudents(students: Student[]) {
    this.studentService.unsubscribeMany(this.selectedCourse, students).subscribe(_ => {

      console.log(students);


      let studentsEnrolled: Student[] = this.enrolledStudents
      let studentsNotInCourse = [...this.studentsNotInCourse]

      students.forEach(s => {
        studentsEnrolled = studentsEnrolled.filter(student => student.id != s.id)
        studentsNotInCourse.push(s)
      });


      this.enrolledStudents = studentsEnrolled
      this.studentsNotInCourse = studentsNotInCourse

      console.log("NOSTRO", this.enrolledStudents, studentsNotInCourse);

    });

  }

  enrollManyCSV(file: File) {
    console.log("upload", file.name)

    this.studentService.enrollManyCSV(this.selectedCourse, file).subscribe(success => {
      this.studentService.getStudentsInCourse(this.selectedCourse).subscribe(data => {
        this.studentsNotInCourse = data;
        this.enrolledStudents = data;
        this.isAllStudentsLoaded = true;
        this.isEnrolledStudentsLoaded = true;
      });
    })
  }

  public getJSON(path): Observable<any> {
    return this.http.get(path);
  }

}
