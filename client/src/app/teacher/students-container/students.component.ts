import { Component, OnInit, ViewChild, Input, Output, EventEmitter, ChangeDetectorRef, OnChanges, SimpleChange } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Student } from '../model/student.model';
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

  constructor(private ref: ChangeDetectorRef) { }

  @ViewChild(MatSidenav) sidenav: MatSidenav;
  @ViewChild(MatTable) table: MatTable<any>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;



  displayedColumns: string[] = ['select', 'id', 'name', 'first name', 'group'];
  myControl = new FormControl();

  // Data sources
  @Input() _enrolledStudents: Student[];
  @Input() allStudents: Student[];
  enrolledStudentsDataSource: MatTableDataSource<Student>;

  @Input() set enrolledStudents(students: Student[]) {

    this._enrolledStudents = students;

    if (this.enrolledStudentsDataSource != undefined) {
      this.enrolledStudentsDataSource.data = this._enrolledStudents;
    }
  }


  // Communicate with container
  @Output() addStudent: EventEmitter<Student> = new EventEmitter<Student>();
  @Output() deleteStudents: EventEmitter<Student[]> = new EventEmitter<Student[]>();


  // Table selection
  selection = new SelectionModel<Student>(true, []);


  // Autocompletion
  filteredOptions: Observable<Student[]>;
  studentSelected: Student = null;

  // Lifecycle hooks -------

  ngOnInit() {

    this.enrolledStudentsDataSource = new MatTableDataSource(this._enrolledStudents);

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


  private _isMatchingStudent(value: string) {

    // Correct matches: 
    //  - Name
    //  - Name Surname
    //  - ID

    return this.allStudents.filter(option => option.id.toLowerCase().indexOf(value) === 0
      || option.name.toLowerCase().indexOf(value) === 0 || option.firstName.toLowerCase().indexOf(value) === 0
      || (option.firstName.toLowerCase() + " " + option.name.toLowerCase()).indexOf(value) === 0)

  }

  private _filter(value: string): Student[] {
    const filterValue = value.toString().toLowerCase();
    return this._isMatchingStudent(filterValue);
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.enrolledStudentsDataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.enrolledStudentsDataSource.data.forEach(row => this.selection.select(row));
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

}
