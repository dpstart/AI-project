import { Component, OnInit } from '@angular/core';
import { Student } from '../../model/student.model';
import { ActivatedRoute, Router } from '@angular/router';
import { RouteStateService } from '../../services/route-state.service';
import { Course } from 'src/app/model/course.model';
import { TeacherService } from 'src/app/services/teacher.service';

export interface Message {
  message: string
  alertType: string
}

@Component({
  selector: 'app-students-cont',
  templateUrl: './students-cont.component.html',
  styleUrls: ['./students-cont.component.css']
})
export class StudentsContComponent implements OnInit {

  isAllStudentsLoaded: boolean = false;
  isEnrolledStudentsLoaded: boolean = false;

  // Data sources
  studentsNotInCourse: Student[];
  enrolledStudents: Student[];

  studentsToDelete: Student[];

  selectedCourse: string
  courseObj: Course

  message: Message



  constructor(
    private teacherService: TeacherService,
    private activatedRoute: ActivatedRoute,
    private routeStateService: RouteStateService,
    private router: Router
  ) {

    this.message = { message: "", alertType: "" }
  }


  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      if (params['course_name']) {

        this.routeStateService.updatePathParamState(params['course_name'])


        this.selectedCourse = params["course_name"];


        this.teacherService.getCourse(this.selectedCourse).subscribe((course: Course) => {

          this.courseObj = course
          this.teacherService.getStudentsInCourse(this.selectedCourse).subscribe(enrolledStudents => {
            this.enrolledStudents = enrolledStudents;

            this.teacherService.getStudents().subscribe(allStudents => {

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
        }, (_) => this.router.navigate(['PageNotFound']))


      }
    })

  }

  addStudent(student: Student) {

    if (this.enrolledStudents.indexOf(student) != -1) {
      let message = {} as Message
      message.alertType = "danger"
      message.message = "Sorry something went wrong try later..."
      this.message = { ...message }
      return;
    }


    this.teacherService
      .enrollOne(this.selectedCourse, student.id)
      .subscribe(success => {
        var data = this.enrolledStudents;
        data.push(student);
        this.enrolledStudents = [].concat(data);
        //remove from all students not in course
        this.studentsNotInCourse = this.studentsNotInCourse.filter(s => s.id != student.id)

        let message = {} as Message
        message.alertType = "success"
        message.message = "Student successfully added."
        this.message = { ...message }


      }, error => {
        let message = {} as Message

        message.alertType = "danger"
        message.message = "Sorry something went wrong try later..."
        this.message = { ...message }
      })

  }

  deleteStudents(students: Student[]) {
    this.teacherService.unsubscribeMany(this.selectedCourse, students).subscribe(_ => {

      let studentsEnrolled: Student[] = this.enrolledStudents
      let studentsNotInCourse = [...this.studentsNotInCourse]

      students.forEach(s => {
        studentsEnrolled = studentsEnrolled.filter(student => student.id != s.id)
        studentsNotInCourse.push(s)
      });


      this.enrolledStudents = studentsEnrolled
      this.studentsNotInCourse = studentsNotInCourse

      let message = {} as Message

      message.alertType = "success"

      if (students.length == 1)
        message.message = `Student successfully removed from course ${this.selectedCourse}.`
      else
        message.message = `Students successfully removed from course ${this.selectedCourse}.`


      this.message = { ...message }
    }, error => {
      let message = {} as Message
      message.alertType = "danger"
      message.message = "Sorry something went wrong try later..."
      this.message = { ...message }
    })


  }

  enrollManyCSV(file: File) {

    this.teacherService.enrollManyCSV(this.selectedCourse, file).subscribe(_ => {
      this.teacherService.getStudentsInCourse(this.selectedCourse).subscribe(data => {
        this.studentsNotInCourse = data;
        this.enrolledStudents = data;
        this.isAllStudentsLoaded = true;
        this.isEnrolledStudentsLoaded = true;
      });

      let message = {} as Message
      message.alertType = "success"
      message.message = "Student successfully added."
      this.message = { ...message }
    }, _ => {
      let message = {} as Message
      message.alertType = "danger"
      message.message = "Sorry something went wrong try later..."
      this.message = { ...message }
    })
  }


  updateCourse(courses: Course[]) {
    this.teacherService.updateCourse(courses[0]).subscribe(response => {
      this.courseObj = { ...response } as Course

      let message = {} as Message
      message.alertType = "success"
      message.message = "Course modified successfully."
      this.message = { ...message }
    }, error => {
      this.courseObj = { ...courses[1] } as Course

      let message = {} as Message
      message.alertType = "danger"
      message = error.message
      this.message = { ...message }

    })
  }
}
