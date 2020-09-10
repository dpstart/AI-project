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


const options = { year: 'numeric', month: 'numeric', day: 'numeric' };

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


  historyHomeworkDataSource: MatTableDataSource<HomeworkVersionDisplayed>
  historyHomeworkColumnsToDisplay: string[]

  courseName: string
  selectedAssignment: Assignment
  idSelectedHomework: number

  addReviewForm: FormGroup = new FormGroup({
    fileName: new FormControl(''),
    markFormControl: new FormControl('', [Validators.min(0), Validators.max(31)])
  })

  addHwVersionForm: FormGroup = new FormGroup({
    fileName: new FormControl('', Validators.required),
  })


  //image to be expanded
  expandedImage: any
  expandedElement: HomeworkVersionDisplayed | null;

  selectedFile: File;
  isDisabled: boolean
  message: string;

  alertType: string

  isAllLoaded: boolean

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

  adjustPaginators() {

    if (this.authService.isRoleTeacher())
      this.historyHomeworkDataSource.paginator = this._teacherPaginator
    else this.historyHomeworkDataSource.paginator = this._studentPaginator
  }



  constructor(
    private _authService: AuthService,
    private teacherService: TeacherService,
    private studentService: StudentService,
    private routeStateService: RouteStateService,
    private sanitizer: DomSanitizer,
    @Inject(MAT_DIALOG_DATA) public data) {

    this.selectedAssignment = data.assignment
    this.idSelectedHomework = data.homework.homeworkId

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

    this.historyHomeworkDataSource = new MatTableDataSource<HomeworkVersionDisplayed>()
    this.expandedImage = null

    this.isDisabled = true
    this.isAllLoaded = false
  }

  public get authService(): AuthService {
    return this._authService;
  }

  selectImageToExpand(element: HomeworkVersion) {
    if (element == this.expandedImage)
      this.expandedImage = null
    else
      this.expandedImage = element
  }

  ngOnInit(): void {
    this.routeStateService.pathParam.subscribe(courseName => {
      this.courseName = courseName
    })


    this.loadVersions();


  }

  private loadVersions() {
    this.teacherService.getHomeworkVersions(this.courseName, this.selectedAssignment.id, this.idSelectedHomework).subscribe((data) => {
      // this.httpClient.get('http://localhost:8080/image/get/' + this.imageName)
      //   .subscribe(
      //     res => {

      let versions = data;

      let source: HomeworkVersionDisplayed[] = [];

      let counter = 0;

      if (versions.length != 0) {
        versions.forEach(version => {

          this.teacherService.getResourceByUrl(version.links.find(link => link.rel === "image").href).subscribe((success: Image) => {

            let base64Data = success.picByte;
            let formattedImage = `data:${success.type};base64,` + '\n' + base64Data;
            let content = this.sanitizer.bypassSecurityTrustResourceUrl(formattedImage);

            let id = version.id;
            console.log(version.deliveryDate);

            let deliveryDate = new Date(version.deliveryDate).toLocaleDateString(undefined, options);

            source.push({ position: versions.length - id - 1, id, content, deliveryDate });
            counter++;

            if (counter == versions.length) {
              source = source.sort((a, b) => b.id - a.id)
              this.historyHomeworkDataSource.data = [...source];
              this.isAllLoaded = true;
            }
          });
        });
      }
      else
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
    form.get("fileName").setValue(this.selectedFile.name)

    if (form.get('fileName').value)
      this.isDisabled = false
  }
  //Gets called when the user clicks on submit to upload the image
  onUpload() {

    //FormData API provides methods and properties to allow us easily prepare form data to be sent with POST HTTP requests.
    const form = new FormData();

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
            this.data.homework.state = "CONSEGNATO"
          else
            this.data.Homework.state = "RIVISTO"
            
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
