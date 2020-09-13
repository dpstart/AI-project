import { Component, OnInit, Inject, AfterViewInit, ViewChild, OnChanges } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { RouteStateService } from 'src/app/services/route-state.service';
import { HomeworkVersion } from 'src/app/model/homework-version';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Homework } from 'src/app/model/homework.model';
import { Assignment } from 'src/app/model/assignment.model';
import { TeacherService } from 'src/app/services/teacher.service';
import { DomSanitizer } from '@angular/platform-browser';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AuthService } from 'src/app/services/auth.service';
import { StudentService } from 'src/app/services/student.service';
import { Image } from 'src/app/model/image.model';
import { take } from 'rxjs/operators';
import { Form, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';


const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' };

export interface HomeworkVersionDisplayed {
  position: number,
  id: number,
  content: any,
  deliveryDate: string
}

@Component({
  selector: 'app-homework-dialog',
  templateUrl: './homework-dialog.component.html',
  styleUrls: ['./homework-dialog.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class HomeworkDialogComponent implements OnInit {

  // Hws data source: mostra le versioni di un determinato studente per un determinato assignment
  historyHomeworkDataSource: MatTableDataSource<HomeworkVersionDisplayed>
  historyHomeworkColumnsToDisplay: string[]


  courseName: string
  selectedAssignment: Assignment
  idSelectedHomework: number



  //*********************************FORMS**************************************** */
  //Usato da un teacher per aggiungere una review
  addReviewForm: FormGroup = new FormGroup({
    fileName: new FormControl(''),
    markFormControl: new FormControl('', [Validators.min(0), Validators.max(31)])
  })

  // Usato da uno student per aggiungere un hw version
  addHwVersionForm: FormGroup = new FormGroup({
    fileName: new FormControl('', Validators.required),
  })

  /******************************************************************************* */

  //Immagine che viene espansa on click
  expandedImage: any
  //Riga della tabella che deve essere aperta se possibile
  expandedElement: HomeworkVersionDisplayed | null;

  //Nome del file che deve essere caricato, questo può rappresentare una hw version o una review del professore a seconda di chi la usa
  selectedFile: File;
  // Pulsante di upload che viene abilitato solo nel momento in cui viene caricato un file
  isDisabled: boolean


  //Messaggio e tipo di alert che viene printato allo user per migliorare la UX
  message: string;
  alertType: string

  //Booleano che viene settato a true nel momento in cui la chiamata dal backend termina
  isAllLoaded: boolean

  //paginatore delle tabelle
  private _studentPaginator: MatPaginator;
  private _teacherPaginator: MatPaginator;


  @ViewChild('studentPaginator') set studentPaginator(value: MatPaginator) {
    this._studentPaginator = value;
    this.adjustPaginators()
  }

  @ViewChild('teacherPaginator') set teacherPaginator(value: MatPaginator) {
    this._teacherPaginator = value;
    this.adjustPaginators()
  }

  constructor(
    private _authService: AuthService,
    private teacherService: TeacherService,
    private studentService: StudentService,
    private routeStateService: RouteStateService,
    private sanitizer: DomSanitizer,
    @Inject(MAT_DIALOG_DATA) public data) {

    // Inizializzazione legata ai parametri passati nel dialog
    this.selectedAssignment = data.assignment
    this.idSelectedHomework = data.homework.homeworkId

    // Colonne tabella a cui viene aggiunta successivamente la colonna action in base a condizione
    this.historyHomeworkColumnsToDisplay = ['id', 'content', 'deliveryDate']

    if (this.authService.isRoleStudent()) {
      if (!data.homework.isFinal && data.homework.state !== 'CONSEGNATO') {
        this.historyHomeworkColumnsToDisplay.push('action');
      }
    } else {
      if (!data.homework.isFinal && data.homework.state === 'CONSEGNATO') {
        this.historyHomeworkColumnsToDisplay.push('action')
      }
    }

    // Inizializzazione data source 
    this.historyHomeworkDataSource = new MatTableDataSource<HomeworkVersionDisplayed>()

    // Immagine selezionata all'inizio
    this.expandedImage = null


    this.isDisabled = true
    this.isAllLoaded = false
  }



  ngOnInit(): void {
    this.routeStateService.pathParam.subscribe(courseName => {
      this.courseName = courseName
    })
    // Carica versioni di un determinato assigment
    this.loadVersions();
  }

  // Getter usato nell vista per poter definire cosa deve essere visualizzato
  public get authService(): AuthService {
    return this._authService;
  }

  /**
   * Funzione usata per settare il paginatore giusto in base a chi è loggato
   */
  adjustPaginators() {
    if (this.authService.isRoleTeacher())
      this.historyHomeworkDataSource.paginator = this._teacherPaginator
    else this.historyHomeworkDataSource.paginator = this._studentPaginator
  }

  /**
   * Funzione usata per definire l'immagine che deve essere ingrandita
   * @param element 
   */
  selectImageToExpand(element: HomeworkVersion) {
    if (element == this.expandedImage)
      this.expandedImage = null
    else
      this.expandedImage = element
  }

  /**
   * Metodo usato per caricare le versioni di un determinato homework
   */
  private loadVersions() {
    this.teacherService.getHomeworkVersions(this.courseName, this.selectedAssignment.id, this.idSelectedHomework).subscribe((data) => {

      let versions = data;

      let source: HomeworkVersionDisplayed[] = [];

      let counter = 0;

      if (versions.length != 0) {

        versions.forEach(version => {

          // per ogni versione si va carica l'immagine corrispondente

          this.teacherService.getResourceByUrl(version.links.find(link => link.rel === "image").href).subscribe((success: Image) => {

            let base64Data = success.picByte;
            let formattedImage = `data:${success.type};base64,` + '\n' + base64Data;
            let content = this.sanitizer.bypassSecurityTrustResourceUrl(formattedImage);

            let id = version.id;
            let deliveryDate = new Date(version.deliveryDate).toLocaleDateString(undefined, options);


            source.push({ position: versions.length - id - 1, id, content, deliveryDate });
            counter++;

            // Se ho caricato tutte le versioni
            if (counter == versions.length) {
              // le ordino in base all'id
              source = source.sort((a, b) => b.id - a.id)
              this.historyHomeworkDataSource.data = [...source];
              this.isAllLoaded = true;
            }
          });
        });
      }
      else // il numero di versioni da visualizzare è pari a 0
        this.isAllLoaded = true;
    });
  }


  expandPanel(version: HomeworkVersionDisplayed) {
    this.expandedElement = this.expandedElement === version ? null : version
  }

  //Gets called when the user selects an image
  public onFileChanged(form: FormGroup, event) {
    //Select File
    this.selectedFile = event.target.files[0];
    //
    form.get("fileName").setValue(this.selectedFile.name)

    if (form.get('fileName').value)
      this.isDisabled = false
  }

  //Gets called when the user clicks on submit to upload the image
  onUpload() {
    //FormData API provides methods and properties to allow us easily prepare form data to be sent with POST HTTP requests.
    const form = new FormData();

    //In base al ruolo, se studente o professore viene aggiunta una nuova versione o una review 
    if (this.authService.isRoleTeacher()) {
      //OPTIMISTIC UPDATE
      let homework = {
        id: this.data.homework.homeworkId, state: 2, isFinal: this.addReviewForm.get('markFormControl').value != "", mark: this.addReviewForm.get('markFormControl').value
      }

      if (this.selectedFile)
        form.append('homeworkVersion', this.selectedFile, this.selectedFile.name);

      if (homework.isFinal) {
        form.append('homework', new Blob([JSON.stringify(homework)], { type: "application/json" }));
      }


      this.teacherService.reviewHomework(this.courseName, this.selectedAssignment.id, homework.id, form).subscribe(
        (response) => {
          this.loadVersions()
          this.data.homework.isFinal = homework.isFinal
          if (homework.isFinal)
            this.data.homework.state = "REGISTRATO"
          else
            this.data.homework.state = "RIVISTO"

          this.data.homework.mark = homework.mark == 0 ? "--" : homework.mark

          this.historyHomeworkColumnsToDisplay.pop()
          this.alertType = "success"
          this.message = 'Image uploaded successfully';
        }, error => {
          this.alertType = "danger"
          this.message = 'Sorry something went wrong, try later...';
        }
      );
    } else if (this.authService.isRoleStudent()) {
      form.append('image', this.selectedFile, this.selectedFile.name);
      this.studentService.uploadHomework(this.courseName, this.selectedAssignment.id, form).subscribe(
        (response) => {
          //OPTIMISTIC UPDATE
          this.loadVersions()
          this.data.homework.state = "CONSEGNATO"
          this.historyHomeworkColumnsToDisplay.pop()
          this.alertType = "success"
          this.message = 'Image uploaded successfully';
        }, error => {
          this.alertType = "danger"
          this.message = 'Sorry something went wrong, try later...';
        }
      );
    }
  }

}
