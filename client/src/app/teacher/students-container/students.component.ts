import { Component, OnInit, ViewChild, Input, Output, EventEmitter, ChangeDetectorRef, OnChanges, SimpleChange, SimpleChanges } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Student } from '../../model/student.model';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTable } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';

import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-students',
  templateUrl: './students.component.html',
  styles: [``]
})
export class StudentsComponent implements OnInit {

  selectedFile: File;
  fileName: string
  isDisabled: boolean

  private _message: string;
  private _alertType: string;

  enrolledStudentsDataSource: MatTableDataSource<Student>;

  // Table selection
  selection = new SelectionModel<Student>(true, []);

  // Autocompletion
  filteredOptions: Observable<Student[]>;
  studentSelected: Student = null;

  displayedColumns: string[] = ['select', 'id', 'name', 'first name', 'group'];


  myControl = new FormControl();

  // Data sources
  private _enrolledStudents: Student[];
  private _studentsNotInCourse: Student[];

  constructor() {
    this.enrolledStudentsDataSource = new MatTableDataSource();
    this.isDisabled = true
    this.paginator.getNumberOfPages
  }

  @ViewChild(MatSidenav) sidenav: MatSidenav;
  @ViewChild(MatTable) table: MatTable<any>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  @Input()
  public set enrolledStudents(value: Student[]) {
    this._enrolledStudents = value;
    this.enrolledStudentsDataSource.data = [...this.enrolledStudents]
  }

  @Input()
  public set studentsNotInCourse(value: Student[]) {
    this._studentsNotInCourse = value;
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value))
    );
  }

  @Input() public set message(value: string) {
    this._message = value;
  }

  @Input() public set alertType(value: string) {
    this._alertType = value;
  }

  // Communicate with container
  @Output() addStudent: EventEmitter<Student> = new EventEmitter<Student>();
  @Output() deleteStudents: EventEmitter<Student[]> = new EventEmitter<Student[]>();
  @Output() enrollManyCsvEvent: EventEmitter<File> = new EventEmitter<File>()

  // Lifecycle hooks -------

  ngOnInit() {
    this.filteredOptions = this.myControl.valueChanges.pipe(
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

  public get message(): string {
    return this._message;
  }
  public get alertType(): string {
    return this._alertType;
  }
  public get enrolledStudents(): Student[] {
    return this._enrolledStudents;
  }
  public get studentsNotInCourse(): Student[] {
    return this._studentsNotInCourse;
  }



  private _isMatchingStudent(value: string) {

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
    return this._isMatchingStudent(filterValue);
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelectedFromPage() {
    const numSelected = this.selection.selected.length;
    const numRows = this.enrolledStudentsDataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelectedFromPage() ?
      this.selection.clear() :
      this.enrolledStudentsDataSource.data.forEach(row => this.selection.select(row));

      //TODO implementare selezione elementi su particolare pagina
  }

  displayWith(student: Student): string {

    if (student == null)
      return;
    return student.firstName + " " + student.name + " (" + student.id + ")";
  }

  autocompleteSelected(student: Student) {
    this.studentSelected = student;
  }

  addStudentEvent() {

    if (this.studentSelected != null) {
      this.addStudent.emit(this.studentSelected);
      this.studentSelected = null;
      //this.enrolledStudentsDataSource.data = this._enrolledStudents;
    }

  }

  isDeleteButtonDisabled() {
    return this.selection.isEmpty();
  }

  _deleteStudents() {

    this.deleteStudents.emit(this.selection.selected)
    this.selection.clear();

    //this.enrolledStudents.data = this.enrolledStudents.data.filter(s => this.selection.selected.indexOf(s) == -1);
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
    this.enrollManyCsvEvent.emit(this.selectedFile);
  }
}
