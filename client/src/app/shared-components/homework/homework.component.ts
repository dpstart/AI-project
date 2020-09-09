import { Component, OnInit, ElementRef, ViewChild, Input, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Homework } from 'src/app/model/homework.model';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Assignment } from 'src/app/model/assignment.model';
import { MatDialog } from '@angular/material/dialog';
import { HomeworkDialogComponent } from './dialog/homework-dialog.component';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { startWith, map } from 'rxjs/operators';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { AuthService } from 'src/app/services/auth.service';
import { TeacherService } from 'src/app/services/teacher.service';

export interface DisplayedHomework {
  assignmentId: number,
  homeworkId: number,
  id: string,
  name: string,
  surname: string,
  state: string,
  timestamp: string
}



export interface DisplayedAssignment {
  id: number,
  releaseDate: String,
  expirationDate: String
}



@Component({
  selector: 'app-homework',
  templateUrl: './homework.component.html',
  styleUrls: ['./homework.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})
export class HomeworkComponent implements OnInit, AfterViewInit {


  public get authService(): AuthService {
    return this._authService;
  }


  selectedFile: File;
  fileName: string
  isDisabled: boolean

  message: string;
  alertType: string

  selectedAssignment: Assignment

  // nome, cognome, matricola,  state,  timestamp  
  homeworksColumnsToDisplay: string[] = ['name', 'surname', 'id', 'state', 'timestamp'];
  homeworksDataSource: Array<MatTableDataSource<DisplayedHomework>>
  allHomeworks: DisplayedHomework[][]

  consegneDisplayedColumns: string[] = ['id', 'releaseDate', 'expirationDate']
  consegneDataSource: MatTableDataSource<DisplayedAssignment>


  private _selectedCourse: string;
  public get selectedCourse(): string {
    return this._selectedCourse;
  }
  @Input() public set selectedCourse(value: string) {
    this._selectedCourse = value;
  }
  private _displayedAssignments: DisplayedAssignment[];
  public get displayedAssignments(): DisplayedAssignment[] {
    return this._displayedAssignments;
  }
  @Input()
  public set displayedAssignments(value: DisplayedAssignment[]) {
    this._displayedAssignments = value;
    this.consegneDataSource.data =[...this.displayedAssignments]
    
  }
  private _displayedHomeworks: DisplayedHomework[];

  public get displayedHomeworks(): DisplayedHomework[] {
    return this._displayedHomeworks;
  }
  @Input()
  public set displayedHomeworks(value: DisplayedHomework[]) {
    this._displayedHomeworks = value;
    for (let i = 0; i < this.displayedAssignments.length; i++) {
      this.homeworksDataSource.push(new MatTableDataSource<DisplayedHomework>())
      this.allHomeworks.push([])
      let newSource = []

      this.displayedHomeworks.forEach(x => {

        if (x.assignmentId == this.displayedAssignments[i].id) {
          newSource.push(x)
        }
      })
      this.homeworksDataSource[i].data = [...newSource]
      this.allHomeworks[i] = this.homeworksDataSource[i].data
      this.filterRowsAccordingToOptions(this.displayedAssignments[i].id)

    }
  }

  assignmentExpandedElement: Assignment | null;

  homeworkExpandedElement: Homework | null;



  //***********chips
  visible = true;
  selectable = true;
  removable = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  optionCtrl = new FormControl();
  filteredOptions: Observable<string[]>;
  options: string[] = ['LETTO', 'NON LETTO', 'RIVISTO', 'CONSEGNATO'];
  allOptions: string[] = [];



  @ViewChild('optionInput') optionInput: ElementRef<HTMLInputElement>;
  @ViewChild('auto') matAutocomplete: MatAutocomplete;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;


  @Output() addedAssignment: EventEmitter<Assignment> = new EventEmitter<Assignment>();
  //************ */




  form: FormGroup = new FormGroup({
    expirationDate: new FormControl(new Date(), Validators.required),
    file: new FormControl('', Validators.required),
    fileName: new FormControl('', Validators.required),

  });

  submit() {
    if (this.form.valid) {

      console.log("send information");
      //FormData API provides methods and properties to allow us easily prepare form data to be sent with POST HTTP requests.
      const formData = new FormData();
      formData.append('assignment', new Blob([JSON.stringify({ expirationDate: this.form.get("expirationDate").value })], {
        type: "application/json"
      }))
      formData.append('image', this.selectedFile, this.selectedFile.name);


      this.teacherService.addAssignment(this.selectedCourse, formData).subscribe(success => {
        this.addedAssignment.emit(success)


      })


    }
  } constructor(
    private dialog: MatDialog,
    private _authService: AuthService,
    private teacherService: TeacherService) {

    this.isDisabled = true
    this.homeworksDataSource = new Array<MatTableDataSource<DisplayedHomework>>();
    this.consegneDataSource = new MatTableDataSource<DisplayedAssignment>();
    this.allHomeworks = []


    //chips
    this.filteredOptions = this.optionCtrl.valueChanges.pipe(
      startWith(null),
      map((option: string | null) => option ? this._filter(option) : this.allOptions.slice().sort()));

  }

  ngOnInit(): void {

    for (let i = 0; i < this.displayedAssignments.length; i++) {
      this.homeworksDataSource.push(new MatTableDataSource<DisplayedHomework>())
      this.allHomeworks.push([])
      let newSource = []

      this.displayedHomeworks.forEach(x => {

        if (x.assignmentId == this.displayedAssignments[i].id) {
          newSource.push(x)
        }
      })
      this.homeworksDataSource[i].data = [...newSource]
      this.allHomeworks[i] = this.homeworksDataSource[i].data
      this.filterRowsAccordingToOptions(this.displayedAssignments[i].id)

    }
    this.consegneDataSource.data = this.displayedAssignments;

  }

  ngAfterViewInit() {
    this.consegneDataSource.paginator = this.paginator;
    this.consegneDataSource.sort = this.sort;
  }



  //*****************chips methods*******************************//


  addOption(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add our options
    if ((value || '').trim()) {
      this.options.push(value.trim());
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.optionCtrl.setValue(null);

  }

  removeOption(option: string, assignmentId: number): void {
    const index = this.options.indexOf(option);
    this.allOptions.push(option);

    this.optionCtrl.setValue(null);

    if (index >= 0) {
      this.options.splice(index, 1);
    }

    this.filterRowsAccordingToOptions(assignmentId)
  }

  selected(event: MatAutocompleteSelectedEvent, assignmentId: number): void {

    this.options.push(event.option.viewValue);
    this.allOptions.splice(this.allOptions.indexOf(event.option.viewValue), 1)
    this.optionInput.nativeElement.value = '';
    this.optionCtrl.setValue(null);

    this.filterRowsAccordingToOptions(assignmentId)
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.allOptions.filter(option => option.toLowerCase().indexOf(filterValue) === 0);
  }

  //****************************************************//


  private filterRowsAccordingToOptions(assignmentId: number) {
    let i = this.displayedAssignments.findIndex(assignment => assignment.id == assignmentId)
    let filteredDataSource = this.allHomeworks[i]
    filteredDataSource = filteredDataSource.filter(element => this.options.includes(element.state))
    this.homeworksDataSource[i].data = filteredDataSource
  }



  selectAssignment(assignment: Assignment) {
    //assignmentExpandedElement === assignment ? null : assignment
    this.selectedAssignment = assignment
  }
  seeHomeworkDetails(homework: DisplayedHomework) {

    const dialogRef = this.dialog.open(HomeworkDialogComponent, {
      height: '95%',
      width: '95%',
      data: {
        assignment: this.assignmentExpandedElement,
        homeworkId: homework.homeworkId
      }
    });
    event.stopPropagation();
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
    console.log(this.selectedFile);


  }

}





