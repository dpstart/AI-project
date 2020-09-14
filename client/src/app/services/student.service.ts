import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Student } from '../model/student.model';
import { catchError, retry } from 'rxjs/operators';
import { Course } from '../model/course.model';
import { Vm } from '../student/vm/vm-student.component';
import { Team } from '../model/team.model';
import { HomeworkVersion } from '../model/homework-version';
import { Assignment } from '../model/assignment.model';
import { Homework } from '../model/homework.model';
import { Image } from '../model/image.model';


export interface NavStudentLinks {
  link: String;
  label: String;
}

export interface ServerError {
  status: number
  message: string
}

export interface VmSettings {
  n_cpu: number,
  disk_space: number,
  ram: number,
  max_active: number,
  max_available: number
}



@Injectable({
  providedIn: 'root'
})
export class StudentService {



  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.ù
      console.log(error)
      console.error('An error occurred:', error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.message}`);
    }

    // return an observable with a user-facing error message

    return throwError({ status: error.status, message: error.error.message });
  };



  private navStudentLinks: NavStudentLinks[];

  constructor(private http: HttpClient) {
    this.navStudentLinks = [{ link: 'groups', label: 'Groups' }, { link: 'vms', label: 'VMs' }, { link: 'homework', label: 'Elaborati' }]
  }

  URL = "http://localhost:4200/API"

  // CREATE

  createVM(course_name: string, teamId: number, formData: FormData) {

    let headers = new HttpHeaders()
    headers.set('Content-Type', 'multipart/form-data');

    const url = `${this.URL}/courses/${course_name}/teams/${teamId}/createVM`;
    return this.http.post(url, formData, { "headers": headers }).pipe(
      retry(3),
      catchError(this.handleError)
    );

  }

  addStudent(s: Student) {

    const url = `${this.URL}/students`;
    return this.http.post<Student>(url, s)
      .pipe(
        retry(3),
        catchError(this.handleError)
      );

  }

  enrollOne(courseName: string, studentId: string) {
    const url = `${this.URL}/courses/${courseName}/enrollOne`;
    return this.http.post<Student>(url, { id: studentId })
      .pipe(
        retry(3),
        catchError(this.handleError)
      );
  }
  /* @PostMapping("/{name}/enrollManyCSV")
      @ResponseStatus(HttpStatus.CREATED)
      void enrollStudentsCSV(@PathVariable String name, @RequestParam("file") MultipartFile file) { */
  enrollManyCSV(courseName: string, file: File) {

    //FormData API provides methods and properties to allow us easily prepare form data to be sent with POST HTTP requests.
    const uploadData = new FormData();
    uploadData.append('file', file, file.name);

    const url = `${this.URL}/courses/${courseName}/enrollManyCSV`

    return this.http.post(url, uploadData).pipe(
      retry(3),
      catchError(this.handleError)
    );


  }

  unsubscribeMany(courseName: string, students: Student[]) {

    let studentIds = []

    students.forEach(student => studentIds.push(student.id))

    const url = `${this.URL}/courses/${courseName}/unsubscribeMany`;
    return this.http.post<Student>(url, { students: studentIds })
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

    return this.http.post(url, { "team": team, "members": membersIds, "timeout": timeout }, {
      observe: 'response'
    }).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }



  uploadHomework(courseName: string, assignmentId: number, uploadImageData: FormData) {

    const url = `${this.URL}/courses/${courseName}/assignments/${assignmentId}`

    return this.http.post(url, uploadImageData).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }



  //RESEARCH

  /*
   @GetMapping("/{name}/teams/{id}/adhesion")
   Map<String, Boolean> getAdhesionInfo(@PathVariable String name, @PathVariable Long id) */
  getAdhesionInfo(courseName: string, teamId: number): Observable<Map<string, string>> {
    const url = `${this.URL}/courses/${courseName}/teams/${teamId}/adhesion`
    return this.http.get<Map<string, string>>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }



  actionToken(token: string, isAccepted: boolean): Observable<boolean> {

    let url = isAccepted ? `http://localhost:4200/notification/confirm/${token}` : `http://localhost:4200/notification/reject/${token}`

    return this.http.get<boolean>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );

  }



  getProposalsToStudent(courseName): Observable<Team[]> {
    ///courses/{name}/teamsProposals
    const url = `${this.URL}/students/courses/${courseName}/teamsProposals/`
    return this.http.get<Team[]>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

  getResourceByUrl(href: string): Observable<any> {
    return this.http.get<any>(href).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }


  getNavStudentLinks(): NavStudentLinks[] {
    return this.navStudentLinks;
  }


  getCourses(): Observable<Course[]> {
    const url = `${this.URL}/students/courses/`
    return this.http.get<Course[]>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );

  }

  connectToVm(vmId: number) {
    const url = `${this.URL}/vms/${vmId}/connect`
    return this.http.get<Image>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );

  }


  getCourse(course_name: string): Observable<Course> {
    const url = `${this.URL}/courses/${course_name}`
    return this.http.get<Course>(url).pipe(
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

  getStudents(): Observable<Array<Student>> {
    const url = `${this.URL}/students`;
    return this.http.get<Array<Student>>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

  // //{name}/assignments/{id1}/homeworks/{id2}/studentId
  // getStudentIdByHomework(courseName: string, assignmentId: number, homeworkId: number): Observable<string> {
  //   const url = `${this.URL}/courses/${courseName}/assignments/${assignmentId}/homeworks/${homeworkId}/studentId`;
  //   return this.http.get<string>(url).pipe(
  //     retry(3),
  //     catchError(this.handleError)
  //   );
  // }


  getStudentsInCourse(course_name: string): Observable<Student[]> {
    const url = `${this.URL}/courses/${course_name}/enrolled`;
    return this.http.get<Student[]>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }


  getTeamsOfStudent(): Observable<Team[]> {
    const url = `${this.URL}/students/teams`;
    return this.http.get<Team[]>(url).pipe(
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
  /**
   * Ritorna il team dello specifico studente che fa la richiesta dato il corso.
   * @param courseName  nome del corso
   */
  getTeamForCourse(courseName: string): Observable<Team> {
    const url = `${this.URL}/students/courses/${courseName}/team`;
    return this.http.get<Team>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

  getTeamMembers(courseName: string, teamId: number): Observable<Student[]> {
    const url = `${this.URL}/courses/${courseName}/teams/${teamId}/members`;
    return this.http.get<Student[]>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );

  }


  getVmsForTeam(teamId: number): Observable<Vm[]> {
    const url = `${this.URL}/vms/teams/${teamId}`;
    return this.http.get<Vm[]>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }


  getHomeworkVersions(course_name: string, assignment_id: number, homework_id: number): Observable<HomeworkVersion[]> {
    const url = `${this.URL}/courses/${course_name}/assignments/${assignment_id}/homeworks/${homework_id}/versions`
    return this.http.get<HomeworkVersion[]>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

  getAssignmentsByCourse(courseName: string): Observable<Assignment[]> {
    const url = `${this.URL}/courses/${courseName}/assignments`
    return this.http.get<Assignment[]>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

  getHomeworksByAssignment(courseName: string, assignmentId: number): Observable<Homework[]> {
    const url = `${this.URL}/courses/${courseName}/assignments/${assignmentId}/homeworks`
    return this.http.get<Homework[]>(url).pipe(
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


  editVM(vmId: number, formData: FormData) {

    let headers = new HttpHeaders()
    headers.set('Content-Type', 'multipart/form-data');

    const url = `${this.URL}/vms/${vmId}/update`;
    return this.http.post(url, formData).pipe(
      retry(3),
      catchError(this.handleError)
    );

  }


  changeVmStatus(vm: Vm) {

    let url = `${this.URL}/vms/${vm.id}`;

    switch (vm.status) {
      //spenta
      case 0:
        url = `${url}/run`
        break;
      //attiva
      case 1:
        url = `${url}/stop`
        break;
    }

    return this.http.get(url).pipe(
      retry(3), catchError(this.handleError)
    );
  }


  //DELETE

  deleteStudent(id: string): Observable<{}> {
    const url = `${this.URL}/students/${id} `; // DELETE api/heroes/42
    return this.http.delete(url)
      .pipe(
        retry(3),
        catchError(this.handleError)
      );
  }


  deleteVm(vm: Vm) {
    const url = `${this.URL}/vms/${vm.id} `; // DELETE api/heroes/42
    return this.http.delete(url).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }


}
