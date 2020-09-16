import { Component, OnInit, ViewChild, Input, Output, EventEmitter, ChangeDetectorRef, OnChanges, SimpleChange, SimpleChanges } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Student } from '../../model/student.model';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTable } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Course } from 'src/app/model/course.model';
import { Message } from 'src/app/teacher/students-container/students-cont.component';


@Component({
  selector: 'app-students',
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.css']
})
export class StudentsComponent implements OnInit {

  selectedFile: File;

  isDisabled: boolean

  isEditing: Boolean


  masterToggleInPageOption = true

  private _message: Message;

  enrolledStudentsDataSource: MatTableDataSource<Student>;

  // Table selection
  selection = new SelectionModel<Student>(true, []);

  // Autocompletion
  filteredOptions: Observable<Student[]>;

  displayedColumns: string[] = ['select', 'id', 'name', 'first name', 'group'];

  addStudentForm: FormGroup

  courseSettingForm: FormGroup

  // Data sources
  private _enrolledStudents: Student[];
  private _studentsNotInCourse: Student[];

  private _courseObj: Course;

  @ViewChild(MatSidenav) sidenav: MatSidenav;
  @ViewChild(MatTable) table: MatTable<any>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort;

  @Input()
  public set enrolledStudents(value: Student[]) {
    this._enrolledStudents = [...value];
    this.enrolledStudentsDataSource.data = [...this.enrolledStudents]
  }

  @Input()
  selectedCourse: string

  @Input() public set message(value: Message) {
    this._message = value;
  }

  @Input() public set courseObj(value: Course) {
    this.isEditing = false
    this._courseObj = value;

    this.courseSettingForm.setValue({
      min: this.courseObj.min,
      max: this.courseObj.max,
      enabled: this.courseObj.enabled
    })
  }

  @Input()
  public set studentsNotInCourse(value: Student[]) {
    this._studentsNotInCourse = value;
    this.filteredOptions = this.addStudentForm.get("studentControl").valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value))
    );
  }




  // Communicate with container
  @Output() addStudent: EventEmitter<Student> = new EventEmitter<Student>();
  @Output() deleteStudents: EventEmitter<Student[]> = new EventEmitter<Student[]>();
  @Output() enrollManyCsvEvent: EventEmitter<File> = new EventEmitter<File>()
  @Output() updateCourse: EventEmitter<Course[]> = new EventEmitter<Course[]>()


  constructor() {
    this.enrolledStudentsDataSource = new MatTableDataSource();
    this.isDisabled = true
    this.isEditing = false

    this.addStudentForm = new FormGroup({
      studentControl: new FormControl(null),
      fileNameControl: new FormControl('')
    })


    this.courseSettingForm = new FormGroup({
      min: new FormControl('', Validators.required),
      max: new FormControl('', Validators.required),
      enabled: new FormControl(false, Validators.required)
    })

  }

  // Lifecycle hooks -------

  ngOnInit() {

    this.filteredOptions = this.addStudentForm.get("studentControl").valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value))
    );
  }

  ngAfterViewInit() {
    this.enrolledStudentsDataSource.paginator = this.paginator;
    this.enrolledStudentsDataSource.sort = this.sort;
  }

  // ----------------------


  //getters

  public get message(): Message {
    return this._message;
  }
  public get enrolledStudents(): Student[] {
    return this._enrolledStudents;
  }
  public get studentsNotInCourse(): Student[] {
    return this._studentsNotInCourse;
  }
  public get courseObj(): Course {
    return this._courseObj;
  }



  private matchingStudents(value: string): Student[] {

    // Correct matches: 
    //  - Name
    //  - Name Surname
    //  - ID

    return this.studentsNotInCourse.filter(option => option.id.toLowerCase().indexOf(value) === 0
      || option.name.toLowerCase().indexOf(value) === 0 || option.firstName.toLowerCase().indexOf(value) === 0
      || (option.firstName.toLowerCase() + " " + option.name.toLowerCase()).indexOf(value) === 0)

  }

  private _filter(value: string): Student[] {
    const filterValue = value.toString().toLowerCase();
    return this.matchingStudents(filterValue);
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.enrolledStudentsDataSource.data.length;
    return numSelected === numRows;
  }

  isAllSelectedInPage(): boolean {

    if (this.masterToggleInPageOption) {
      let indexStartingElement = this.paginator.pageIndex == 0 ? 0 : (this.paginator.pageIndex * this.paginator.pageSize)
      let indexEndElement = (indexStartingElement + this.paginator.pageSize)

      indexEndElement = indexEndElement > (this.enrolledStudentsDataSource.data.length - 1) ?
        (this.enrolledStudentsDataSource.data.length) : indexEndElement

      let allSelected = true

      for (let i = indexStartingElement; i < indexEndElement; i++) {
        if (!this.selection.isSelected(this.enrolledStudentsDataSource.data[i])) {
          allSelected = false
        }
      }
      return allSelected

    } else return this.isAllSelected()


  }

  toggleSelectionOptionAndSelect() {
    //prima volta che clicco su bottone
    if (this.masterToggleInPageOption) {
      this.masterToggleInPageOption = false
      this.masterToggle()
      this.message.message = `Tutti i ${this.selection.selected.length} studenti sono stati selezionati.`

    } else {
      //seconda volta che clicco => annulla
      this.message.message = ""
      this.masterToggle()
      this.masterToggleInPageOption = true
    }

  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    if (this.isAllSelectedInPage()) {
      this.selection.clear()
      this.message = { message: "", alertType: "" } as Message
      this.masterToggleInPageOption = true
    } else {


      if (this.masterToggleInPageOption) {
        let indexStartingElement = this.paginator.pageIndex == 0 ? 0 : (this.paginator.pageIndex * this.paginator.pageSize)
        let indexEndElement = indexStartingElement + this.paginator.pageSize

        indexEndElement = indexEndElement > (this.enrolledStudentsDataSource.data.length - 1) ? (this.enrolledStudentsDataSource.data.length) : indexEndElement

        for (let i = indexStartingElement; i < indexEndElement; i++) {
          this.selection.select(this.enrolledStudentsDataSource.sortData(this.enrolledStudentsDataSource.data, this.sort)[i])
        }



        if (this.isAllSelected() != this.isAllSelectedInPage()) {
          this.message.message = `Tutti i ${this.selection.selected.length} studenti in questa pagina sono stati selezionati.`
          this.message.alertType = "secondary"
        }

      } else {
        this.enrolledStudentsDataSource.data.forEach(row => this.selection.select(row));
      }
    }
  }

  displayWith(student: Student): string {
    if (student == null)
      return;
    return student.firstName + " " + student.name + " (" + student.id + ")";
  }

  autocompleteSelected(student: Student) {
    this.addStudentForm.get('studentControl').setValue(student)
  }

  addStudentEvent() {

    if (this.addStudentForm.get("studentControl").value != null) {
      this.addStudent.emit(this.addStudentForm.get("studentControl").value);
      this.addStudentForm.get('studentControl').setValue(null)
    }

  }

  isDeleteButtonDisabled() {
    return this.selection.isEmpty();
  }

  _deleteStudents() {
    this.deleteStudents.emit(this.selection.selected)
    this.selection.clear();
  }

  //Gets called when the user selects an image
  public onFileChanged(event) {
    //Select File
    this.selectedFile = event.target.files[0];
    this.addStudentForm.get('fileNameControl').setValue(this.selectedFile.name)
    if (this.addStudentForm.get('fileNameControl'))
      this.isDisabled = false
  }
  //Gets called when the user clicks on submit to upload the image
  onUpload() {
    this.enrollManyCsvEvent.emit(this.selectedFile);
  }



  toggleEditSettings() {

    let course = { ...this.courseObj } as Course

    //Corso viene settato allora devi confermarlo
    if (this.isEditing) {

      course.min = this.courseSettingForm.get('min').value

      course.max = this.courseSettingForm.get('max').value

      course.enabled = this.courseSettingForm.get('enabled').value

      this.updateCourse.emit([course, this.courseObj])
    }

    this.isEditing = !this.isEditing
  }
}
