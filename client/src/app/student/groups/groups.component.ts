import { Component, OnInit } from '@angular/core';
import { StudentService } from 'src/app/services/student.service';
import { Observable } from 'rxjs';
import { Student } from 'src/app/model/student.model';
import { MatTableDataSource } from '@angular/material/table';
import { Router, ActivatedRoute } from '@angular/router';
import { TeacherService } from 'src/app/services/teacher.service';
import { SelectionModel } from '@angular/cdk/collections';
import { Course } from 'src/app/model/course.model';
import { FormControl } from '@angular/forms';

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



  groupName: FormControl

  constructor(private router: ActivatedRoute, private _studentService: StudentService, private teacherService: TeacherService) {


    this.isDisabled = true
    this.studentsInTeam = []
    this.dataSourceStudentsInTeam = new MatTableDataSource<Student>();


    this.dataSourceStudentsNotYetInTeam = new MatTableDataSource<Student>();
    this.displayedColumns = ['select', 'id', 'name', 'first name', 'group'];


    this.groupName = new FormControl('');
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
      this.isDisabled = true;
      this.selection.clear()
    } else {
      this.isDisabled = false
      this.dataSourceStudentsNotYetInTeam.data.forEach(row => this.selection.select(row));

    }
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
    let numSelected = this.selection.selected.length
    switch (numSelected) {
      case 0:
        this.isDisabled = true
        break;
      default:
        if (this.selectedCourse.min < numSelected && numSelected < this.selectedCourse.max && true) { //TODO: inserire condizione sul nome del gruppo
          this.isDisabled = false;
        }
        break;
    }

  }

  //TODO: submission
  onSubmit() {
    console.log("submit")
  }



}
