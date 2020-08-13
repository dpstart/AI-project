import { Component, OnInit } from '@angular/core';
import { StudentService } from 'src/app/services/student.service';
import { Student } from 'src/app/model/student.model';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { TeacherService } from 'src/app/services/teacher.service';
import { SelectionModel } from '@angular/cdk/collections';
import { Course } from 'src/app/model/course.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css']
})
export class GroupsComponent implements OnInit {



  public get studentService(): StudentService {
    return this._studentService;
  }

  studentsInTeam: Student[];
  selectedCourse: Course;



  // Table selection
  selection = new SelectionModel<Student>(true, []);


  // button is enabled 
  isDisabled: boolean


  //Table related properties
  dataSourceStudentsInTeam: MatTableDataSource<Student>
  dataSourceStudentsNotYetInTeam: MatTableDataSource<Student>
  displayedColumns: string[]
  expandedElement: Student | null;


  //Table of proposals:
  dataSourceProposals: MatTableDataSource<any>
  displayedColumnsProposals: string[]


  form: FormGroup


  constructor(private router: ActivatedRoute, private _studentService: StudentService) {


    this.isDisabled = true

    //students table
    this.studentsInTeam = []
    this.dataSourceStudentsInTeam = new MatTableDataSource<Student>();
    this.dataSourceStudentsNotYetInTeam = new MatTableDataSource<Student>();
    this.displayedColumns = ['select', 'id', 'name', 'first name', 'group'];

    //proposals table
    this.dataSourceProposals = new MatTableDataSource()
    this.displayedColumnsProposals = ['groupName', 'matricola', 'name', 'firstName'];

    this.form = new FormGroup({
      groupNameControl: new FormControl('', [Validators.required]),
      timeoutControl: new FormControl('23:59', [Validators.required, Validators.min(10)]) //10 min
    })

  }

  ngOnInit(): void {
    this.router.params.subscribe(params => {
      if (params["course_name"]) {

        this.studentService.getCourse(params["course_name"]).subscribe((selectedCourse: Course) => {
          this.selectedCourse = selectedCourse;

          this.studentService.getTeamsOfStudent().subscribe(
            (data) => {
              this.studentsInTeam = data

              //Now we can see if the student is already in team or not by looking to the length of the studentsInTeam array:
              if (this.studentsInTeam.length == 0) {
                //students is not yet in team: we have to upload in the table only the students that are not in a team

                this.studentService.getStudentsAvailableInCourse(this.selectedCourse.name).subscribe((studentsNotInTeam: Student[]) => {
                  this.dataSourceStudentsNotYetInTeam = new MatTableDataSource<Student>(studentsNotInTeam)
                })
              }
            })
        })
      }
    })

  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear()
    } else {
      this.dataSourceStudentsNotYetInTeam.data.forEach(row => this.selection.select(row));
    }
    this.checkValidity()
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSourceStudentsNotYetInTeam.data.length;
    return numSelected === numRows;
  }


  /**
   * This method is called whenever a student has defined the configuration of the group and press the add group button.
   */
  addStudentsToGroup() {
    //this method needs to call the service
    console.log("add group")
  }

  /**
   * This method is called whenever a student is checked in the table.
   * Called to check if the rule of the group in the course is respected
   * @param row The selected row in the table
   */
  toggleRow(row) {
    this.selection.toggle(row)
    this.checkValidity()
  }


  checkValidity() {
    let numSelected = this.selection.selected.length
    switch (numSelected) {
      case 0:
        this.isDisabled = true
        break;
      default:
        if (this.selectedCourse.min < numSelected && numSelected < this.selectedCourse.max && this.form.valid) {
          this.isDisabled = false
        } else {
          this.isDisabled = true
        }
        break;
    }

  }

  //TODO: check if submission has gone well
  onSubmit() {
    this.studentService.addGroup(this.form.get('groupNameControl').value, this.selection.selected, this.form.get('timeoutControl').value)
  }



}
