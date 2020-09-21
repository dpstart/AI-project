import { Injectable } from '@angular/core';
import { combineLatest, forkJoin, from, merge, Observable, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Student } from '../model/student.model';
import { catchError, concatMap, map, mergeAll, mergeMap, retry } from 'rxjs/operators';
import { Course } from '../model/course.model';
import { Vm } from '../student/vm/vm-student.component';
import { Team } from '../model/team.model';
import { HomeworkVersion } from '../model/homework-version';
import { Assignment } from '../model/assignment.model';
import { Homework } from '../model/homework.model';
import { Image } from '../model/image.model';
import { of } from 'rxjs/internal/observable/of';


/**
 * Interfaccia link per gli studenti usato nelle tab 
 */
export interface NavStudentLinks {
  link: String;
  label: String;
}

/**
 * Interfaccia per mappare errori
 */
export interface ServerError {
  status: number
  message: string
}

/**
 * Interfaccia per settare i settings di una Vm
 */
export interface VmSettings {
  n_cpu: number,
  disk_space: number,
  ram: number,
  max_active?: number,
  max_available?: number
}

@Injectable({
  providedIn: 'root'
})
export class StudentService {

  // Link studenti nelle tab
  private navStudentLinks: NavStudentLinks[];

  constructor(private http: HttpClient) {
    this.navStudentLinks = [
      { link: 'groups', label: 'Groups' },
      { link: 'vms', label: 'VMs' },
      { link: 'homework', label: 'Homeworks' }
    ]
  }

  URL = "http://localhost:4200/API"

  //*********************************************** CREATE ****************************************************//

  /**
   * Metodo che permette di aggiungere una Vm
   * @param course_name 
   * @param teamId 
   * @param formData 
   * 
   * Il formData richiede due campi una immagine della vm e i corrispettivi settings
   * 
      let settings: VmSettings = {
        ram: this.form.value.ram, n_cpu: this.form.value.n_cpu, disk_space: this.form.value.disk_space,
        max_active: 0, max_available: 0
      }

      formData.append('image', this.selectedFile, this.fileName);
      formData.append('settings', new Blob([JSON.stringify(settings)], {
        type: "application/json"
      }))
   */
  createVM(course_name: string, teamId: number, formData: FormData) {

    let headers = new HttpHeaders()
    headers.set('Content-Type', 'multipart/form-data');

    const url = `${this.URL}/courses/${course_name}/teams/${teamId}/createVM`;
    return this.http.post(url, formData, { "headers": headers }).pipe(
      retry(3),
      catchError(this.handleError)
    );

  }

  /**
   * Metodo che permette l'aggiunta di uno studente
   * @param student 
   */
  addStudent(student: Student) {

    const url = `${this.URL}/students`;
    return this.http.post<Student>(url, student)
      .pipe(
        retry(3),
        catchError(this.handleError)
      );
  }

  /**
   * Metodo che permette di mandare una proposta per un team
   * @param courseName: nome del corso 
   * @param teamName: nome del team che si propone
   * @param members: membri del team
   * @param timeout: scadenza proposta
   */
  proposeTeam(courseName: string, teamName: string, members: Student[], timeout: number) {
    const url = `${this.URL}/courses/${courseName}/proposeTeam`

    let membersIds: string[] = []

    //Ciò che viene inviato sono gli id degli studenti
    members.forEach((student) => {
      membersIds.push(student.id)
    })

    return this.http.post(url, { "team": teamName, "members": membersIds, "timeout": timeout }, {
      observe: 'response'
    }).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

  /**
   * Metodo che permette di creare una nuova versione dell'homework per un determinato assignment e corso.
   * @param courseName: nome del corso
   * @param assignmentId: assignemnt id
   * @param uploadImageData: il form contiene la seguente:
   * Immagine relativa a homework in questione
   * form.append('image', this.selectedFile, this.selectedFile.name);
   */
  uploadHomework(courseName: string, assignmentId: number, uploadImageData: FormData) {

    const url = `${this.URL}/courses/${courseName}/assignments/${assignmentId}`

    return this.http.post(url, uploadImageData).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }



  //********************************************* RESEARCH ******************************************************//

  /**
   * Metodo generico che permette di ritirare qualsiasi risorsa contattando la url specificata come parametro
   * @param href: endpoint da contattare === url
   */
  getResourceByUrl(href: string): Observable<any> {
    return this.http.get<any>(href).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

  /**
   * Metodo che permette di ottenere i link della tab degli studenti
   */
  getNavStudentLinks(): NavStudentLinks[] {
    return this.navStudentLinks;
  }

  /**
   * Metodo che permette di ricavare informazioni relative allo stato di adesione dei membri per una determinata proposta ad un team
   * @param courseName: nome del corso 
   * @param teamId: id team proposto
   */
  getAdhesionInfo(courseName: string, teamId: number): Observable<Map<string, string>> {

    const url = `${this.URL}/courses/${courseName}/teams/${teamId}/adhesion`

    return this.http.get<Map<string, string>>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

  /**
   * Metodo che permette di accettare o rifiutare la proposta per un determinato team contattando semplicemente la url corrispondente 
   * @param token 
   * @param isAccepted 
   */
  actionToken(token: string, isAccepted: boolean): Observable<boolean> {

    let url = isAccepted ? `http://localhost:4200/notification/confirm/${token}` : `http://localhost:4200/notification/reject/${token}`

    return this.http.get<boolean>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

  /**
   * Metodo che permette di confermare account
   * @param token 
   */
  confirmAccount(token: string) {
    const url = `http://localhost:4200/notification/activate/${token}`
    return this.http.get<boolean>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

  /**
   * Metodo che permette di ottenere le proposte ricevute dallo studente che effettua la chiamata
   * @param courseName: nome del corso
   */
  getProposalsToStudent(courseName): Observable<Team[]> {

    const url = `${this.URL}/students/courses/${courseName}/teamsProposals/`

    return this.http.get<Team[]>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

  /**
   * Metodo che permette di ricavare i corsi di un determinato studente
   */
  getCourses(): Observable<Course[]> {

    const url = `${this.URL}/students/courses/`

    return this.http.get<Course[]>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

  /**
   * Metodo che permette di creare una connessione verso una vm
   * @param vmId: id vm
   */
  connectToVm(vmId: number): Observable<Image> {

    const url = `${this.URL}/vms/${vmId}/connect`

    return this.http.get<Image>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }


  /**
   * Metodo che permette di ricavare un corso dato il suo nome
   * @param course_name 
   */
  getCourse(course_name: string): Observable<Course> {

    const url = `${this.URL}/courses/${course_name}`

    return this.http.get<Course>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

  /**
   * Metodo che permette di ricavare uno studente dato il suo id
   * @param id 
   */
  getStudentById(id: string): Observable<Student> {

    const url = `${this.URL}/students/${id}`;

    return this.http.get<Student>(url).pipe(
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

  /**
   * Metodo che permette di ricavare i team dello studente che effettua la chiamata
   */
  getTeamsOfStudent(): Observable<Team[]> {

    const url = `${this.URL}/students/teams`;

    return this.http.get<Team[]>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

  /**
   * Metodo che permette di ricavare gli studenti che non sono ancora in un team dato il nome del corso
   * @param courseName 
   */
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

  /**
   * Metodo che permette di ricavare i membri di un determinato team 
   * @param courseName: nome del corso in cui è presente il team
   * @param teamId: team id
   */
  getTeamMembers(courseName: string, teamId: number): Observable<Student[]> {

    const url = `${this.URL}/courses/${courseName}/teams/${teamId}/members`;

    return this.http.get<Student[]>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

  /**
   * Metodo che permette di ricavare gli owner di una vm
   * @param vmId: ID della vm
   */
  getOwnersMultiple(vmIds: number[]) {


    const source: Observable<any>[] = vmIds.map(id => this.http.get<Student[]>(`${this.URL}/vms/${id}/owners`).pipe(catchError(this.handleError)))

    return combineLatest(source);
  }

  getOwners(vmId: number) {

    const url = `${this.URL}/vms/${vmId}/owners`;

    return this.http.get<Student[]>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }


  /**
   * Metodo che permette di ricavare le Vm per un determinato team
   * @param teamId: id team
   */
  getVmsForTeam(teamId: number): Observable<Vm[]> {

    const url = `${this.URL}/vms/teams/${teamId}`;

    return this.http.get<Vm[]>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

  /**
   * Metodo che permette di ricavare le versioni di un determinato homework
   * @param course_name: nome del corso in cui l'assignment è stato assegnato
   * @param assignment_id: id assignment
   * @param homework_id: id homework
   */
  getHomeworkVersions(course_name: string, assignment_id: number, homework_id: number): Observable<HomeworkVersion[]> {

    const url = `${this.URL}/courses/${course_name}/assignments/${assignment_id}/homeworks/${homework_id}/versions`

    return this.http.get<HomeworkVersion[]>(url).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

  //********************************************** UPDATE **************************************************************//

  /**
   * Metodo che permette di effettuare l'update per un determinato studente
   */
  updateStudent(s: Student) {

    const url = `${this.URL}/students/${s.id}`;

    return this.http.put<Student>(url, s).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

  /**
   * Metodo che permette di effettuare una modifica ad una determinata Vm identificata dal suo id
   * @param vmId 
   * @param formData il form contiene la segiente:
   *  Immagine Vm se presente
      formData.append('image', this.selectedFile, this.selectedFile.name);

      export interface VmSettings {
        n_cpu: number,
        disk_space: number,
        ram: number,
        max_active?: number,
        max_available?: number
      }

      Impostazioni Vm
      formData.append('settings', new Blob([JSON.stringify(settings)], {
        type: "application/json"
      }))
   */
  editVM(vmId: number, formData: FormData) {


    const url = `${this.URL}/vms/${vmId}/update`;

    let headers = new HttpHeaders()
    headers.set('Content-Type', 'multipart/form-data');

    return this.http.post(url, formData).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

  /**
   * Metodo che permette di cambiare lo stato di una determinata vm
   * @param vm 
   */
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

  shareOwnership(vmId: number, studentIds: string[]) {

    const url = `${this.URL}/vms/${vmId}/share`;
    //const source: number[] = studentIds.map(s => ts.his.http.post(url, { id: s }))

    return from(studentIds).pipe(

      map(s => this.http.post(url, { id: s })),
      concatMap(catchError(this.handleError))
    )

  }


  //******************************************** DELETE *****************************************************//

  /**
   * Metodo che permette di eleminare uno studente dato il suo id
   * @param id 
   */
  deleteStudent(id: string): Observable<{}> {

    const url = `${this.URL}/students/${id} `; // DELETE api/heroes/42

    return this.http.delete(url)
      .pipe(
        retry(3),
        catchError(this.handleError)
      );
  }

  /**
   * Metodo che permette di eliminare una determinata Vm
   * @param vm 
   */
  deleteVm(vm: Vm) {

    const url = `${this.URL}/vms/${vm.id}`;

    return this.http.delete(url).pipe(
      retry(3),
      catchError(this.handleError)
    );
  }

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


}
