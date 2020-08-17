import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Student } from '../model/student.model';
import { catchError, retry, map } from 'rxjs/operators';
import { Course } from '../model/course.model';


export interface NavStudentLinks {
  link: String;
  label: String;
}


@Injectable({
  providedIn: 'root'
})
export class StudentService {


  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    // return an observable with a user-facing error message
    return throwError(
      'Something bad happened; please try again later.');
  };

  private navStudentLinks: NavStudentLinks[];

  constructor(private http: HttpClient) {
    this.navStudentLinks = [{ link: 'groups', label: 'Groups' }, { link: 'vms', label: 'VMs' }, { link: 'homework', label: 'Elaborati' }]
  }

  getNavStudentLinks() {
    return this.navStudentLinks;
  }



  URL = "http://localhost:4200/API"





  // CREATE

  addStudent(s: Student) {

    const url = `${this.URL}/students`;
    return this.http.post<Student>(url, s)
      .pipe(
        retry(3),
        catchError(this.handleError)
      );

  }

  proposeTeam(courseName: string, team: string, members: Student[], timeout: number) {
    const url = `${this.URL}/courses/${courseName}/proposeTeam`
    let membersIds: string[] = []
    members.forEach((student) => {
      membersIds.push(student.id)
    })
    let milliTimeout = timeout * 60 * 1000
    console.log(courseName, team, membersIds, milliTimeout)


    return this.http.post(url, { "team": team, "members": membersIds, "timeout": 66000000000 }, {
      observe: 'response'
    }).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }



  //RESEARCH

  getCourse(course_name: string): Observable<Course> {
    const url = `${this.URL}/courses/${course_name}`
    return this.http.get<Course>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

  getStudents(): Observable<Array<Student>> {
    const url = `${this.URL}/students`;
    return this.http.get<Array<Student>>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

  getStudentById(id: string): Observable<Student> {
    const url = `${this.URL}/students/${id}`;
    return this.http.get<Student>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }


  getStudentsInCourse(course_name: string): Observable<Student[]> {
    const url = `${this.URL}/courses/${course_name}/enrolled`;
    return this.http.get<Student[]>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }


  getTeamsOfStudent(): Observable<Student[]> {
    const url = `${this.URL}/students/teams`;
    return this.http.get<Student[]>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

  getStudentsAvailableInCourse(courseName: string): Observable<Student[]> {
    const url = `${this.URL}/courses/${courseName}/available`;
    return this.http.get<Student[]>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

  //UPDATE

  updateStudent(s: Student) {

    const url = `${this.URL}/students/${s.id}`;
    return this.http.put<Student>(url, s).pipe(
      retry(3),
      catchError(this.handleError)
    );

  }

  enrollStudents(students: Student[], courseId: number) {

    students.forEach(element => {
      element.courseId = courseId;
      this.updateStudent(element);
    });

  }

  unenrollStudents(students: Student[], courseId: number) {

    students.forEach(element => {
      element.courseId = 0;
      this.updateStudent(element);
    });

  }



  //DELETE

  deleteStudent(id: string): Observable<{}> {
    const url = `${this.URL}/students/${id} `; // DELETE api/heroes/42
    return this.http.delete(url)
      .pipe(
        catchError(this.handleError)
      );
  }
}
