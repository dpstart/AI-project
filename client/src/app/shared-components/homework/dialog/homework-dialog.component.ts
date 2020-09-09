import { Component, OnInit, Inject } from '@angular/core';
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


  //image to be expanded
  expandedImage: any

  expandedElement: HomeworkVersionDisplayed | null;


  selectedFile: File;
  fileName: string

  isDisabled: boolean
  message: string;

  alertType: string

  isAllLoaded: boolean

  constructor(
    private _authService: AuthService,
    private teacherService: TeacherService,
    private studentService: StudentService,
    private routeStateService: RouteStateService,
    private sanitizer: DomSanitizer,
    @Inject(MAT_DIALOG_DATA) public data) {



    this.selectedAssignment = data.assignment
    this.idSelectedHomework = data.homework.homeworkId

    console.log(data.homework.state, data.homework.state === 'CONSEGNATO')

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
  public onFileChanged(event) {
    //Select File
    this.selectedFile = event.target.files[0];
    this.fileName = this.selectedFile.name
    if (this.fileName)
      this.isDisabled = false
  }
  //Gets called when the user clicks on submit to upload the image
  onUpload() {

    //FormData API provides methods and properties to allow us easily prepare form data to be sent with POST HTTP requests.
    const uploadImageData = new FormData();
    uploadImageData.append('image', this.selectedFile, this.selectedFile.name);


    if (this.authService.isRoleTeacher()) {

      let homework = { id: this.data.homework.homeworkId, state: 2, isFinal: false, mark: 0.0 }
      this.teacherService.reviewHomework(this.courseName, this.selectedAssignment.id, homework).subscribe(
        (response) => {
          this.loadVersions()
          this.data.homework.state = "RIVISTO"
          this.data.homework.isFinal = homework.isFinal
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
      this.studentService.uploadHomework(this.courseName, this.selectedAssignment.id, uploadImageData).subscribe(
        (response) => {
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
