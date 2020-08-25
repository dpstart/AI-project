import { Component, OnInit } from '@angular/core';
import { StudentService, ServerError } from 'src/app/services/student.service';
import { Student } from 'src/app/model/student.model';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { TeacherService } from 'src/app/services/teacher.service';
import { SelectionModel } from '@angular/cdk/collections';
import { Course } from 'src/app/model/course.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { RouteStateService } from 'src/app/services/route-state.service';
import { group } from 'console';

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
  dataSourceStudentInTeam: MatTableDataSource<Student>
  dataSourceStudentNotYetInTeam: MatTableDataSource<Student>
  displayedColumns: string[]
  expandedElement: Student | null;


  //Table of proposals:
  dataSourceProposals: MatTableDataSource<Proposal>
  displayedColumnsProposals: string[]

  displayedColumnsInTeam: string[]

  form: FormGroup

  isLoading: boolean // loading

  isInTeam: boolean

  constructor(private activatedRoute: ActivatedRoute, private _studentService: StudentService, private authService: AuthService, private routeStateService: RouteStateService) {
    this.isInTeam = false // inizializzato a false indica che lo studente non è in un team
    this.isLoading = true // caricamento 
    this.isDisabled = true // indica se il bottone può essere premuto o meno

    //students table
    this.studentsInTeam = []
    this.dataSourceStudentInTeam = new MatTableDataSource<Student>();
    this.dataSourceStudentNotYetInTeam = new MatTableDataSource<Student>();
    this.displayedColumns = ['select', 'id', 'name', 'first name', 'group'];

    //proposals table
    this.dataSourceProposals = new MatTableDataSource()
    this.displayedColumnsProposals = ['idCreator', 'groupName', 'matricola', 'name', 'firstName'];
    this.displayedColumnsInTeam = ['group', 'id', 'name', 'first name']


    this.form = new FormGroup({
      groupNameControl: new FormControl('', [Validators.required]),
      timeoutControl: new FormControl(10, [Validators.required, Validators.min(10)]) //10 min
    })

  }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {
      if (params["course_name"]) {

        // Update the course into the service so that all the other components will know it
        this.routeStateService.updatePathParamState(params['course_name'])

        this.studentService.getCourse(params["course_name"]).subscribe((selectedCourse: Course) => {
          this.selectedCourse = selectedCourse;

          this.studentService.getTeamForCourse(this.selectedCourse.name).subscribe(
            (teams) => {
              this.isLoading = false
              this.isInTeam = true

              //Now we can see if the student is already in team or not by looking to the length of the studentsInTeam array:
              this.studentService.getTeamMembers(this.selectedCourse.name, teams.id).subscribe((students) => {
                students.push(new Student("<sdsa", "Aa", "bbb"))

                students.forEach(element => {
                  element["group"] = teams.name
                });
                this.dataSourceStudentInTeam.data = [...students]
              })


            }, (error: ServerError) => {

              this.isLoading = false
              this.isInTeam = false
              if (error.status == 417) { 
                //students is not yet in team: we have to upload in the table only the students that are not in a team
                this.studentService.getStudentsAvailableInCourse(this.selectedCourse.name).subscribe((studentsNotInTeam: Student[]) => {
                  studentsNotInTeam.push(new Student("<sdsa", "Aa", "bbb"))
                  studentsNotInTeam.push(new Student("<sdsa", "Aa", "bbb"))
                  
                  this.dataSourceStudentNotYetInTeam.data = [...studentsNotInTeam]
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
      this.dataSourceStudentNotYetInTeam.data.forEach(row => this.selection.select(row));
    }
    this.checkValidity()
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSourceStudentNotYetInTeam.data.length;
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
    // Check if all fields are correctly setted.
    if (!this.isDisabled) {

      this.studentService.proposeTeam(this.selectedCourse.name,
        this.form.get('groupNameControl').value,
        this.selection.selected,
        this.form.get('timeoutControl').value).subscribe(((resp) => {
          if (resp.status === 201) { // Ok created
            // TODO: fill dataSourceProposals with the proposed members in the team


            let studentsSelected = this.selection.selected
            let idCreator = this.authService.getEmail()
            let groupName = this.form.get('groupNameControl').value


            // Add the new proposals 
            let proposals: Proposal[] = []

            for (let student of studentsSelected) {
              proposals.push({ idCreator: idCreator, groupName: groupName, matricola: student.id, name: student.name, firstName: student.firstName })
            }
            // New data source
            this.dataSourceProposals = new MatTableDataSource<Proposal>(proposals)

            // Remove students selected
            this.selection.clear()
          }
        }))

    }

  }



}

export interface Proposal {
  idCreator: string
  groupName: string
  matricola: string
  name: string
  firstName: string
}

export interface StudentInGroup {
  group: string
  student: Student
}
