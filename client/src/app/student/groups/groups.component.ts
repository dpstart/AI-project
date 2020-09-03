import { Component, OnInit, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { StudentService, ServerError } from 'src/app/services/student.service';
import { Student } from 'src/app/model/student.model';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { SelectionModel } from '@angular/cdk/collections';
import { Course } from 'src/app/model/course.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { RouteStateService } from 'src/app/services/route-state.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

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

  isErrorAlertOpen: boolean

  isInTeam: boolean

  private paginatorNotInTeam: MatPaginator;
  private matSortNotInTeam: MatSort;

  private _paginatorInTeam: MatPaginator;
  private _matSortInTeam: MatSort;

  private _paginatorProposal: MatPaginator;
  private _matSortProposal: MatSort;



  @ViewChild('matSortNotInTeam') set matSort(ms: MatSort) {
    this.matSortNotInTeam = ms;
    this.setDataSourceAttributes();
  }

  @ViewChild('paginatorNotInTeam') set matPaginator(mp: MatPaginator) {
    this.paginatorNotInTeam = mp;
    this.setDataSourceAttributes();
  }

  @ViewChild('matSortInTeam') set matSortInTeam(ms: MatSort) {
    this._matSortInTeam = ms;
    this.setDataSourceAttributes();
  }

  @ViewChild('paginatorInTeam') set matPaginatorInTeam(mp: MatPaginator) {
    this._paginatorInTeam = mp;
    this.setDataSourceAttributes();
  }

  @ViewChild('matSortProposal') set matSortProposal(ms: MatSort) {
    this._matSortProposal = ms;
    this.setDataSourceAttributes();
  }

  @ViewChild('paginatorProposal') set matPaginatorProposal(mp: MatPaginator) {
    this._paginatorProposal = mp;
    this.setDataSourceAttributes();
  }

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


    this.isErrorAlertOpen = false

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

                students.forEach(element => {
                  element["group"] = teams.name
                });
                this.dataSourceStudentInTeam.data = [...students]
              })
            },

            (error: ServerError) => {
              console.log("RAMO ERRORE MA E' OK");
              this.isInTeam = false
              if (error.status == 417) {
                //students is not yet in team: we have to upload in the table only the students that are not in a team
                this.studentService.getStudentsAvailableInCourse(this.selectedCourse.name).subscribe((studentsNotInTeam: Student[]) => {

                  this.dataSourceStudentNotYetInTeam.data = [...studentsNotInTeam]
                }, (_) => this.isLoading = false
                )

                this.studentService.getProposalsToStudent(this.selectedCourse.name).subscribe(proposedTeams => {


                  if (proposedTeams.length != 0) {

                    // Add the new proposals 
                    let proposals: Proposal[] = []
                    proposedTeams.forEach(team => {
                      this.studentService.getTeamMembers(this.selectedCourse.name, team.id).subscribe((studentsInTeamProposed) => {

                        studentsInTeamProposed.forEach(student => {
                          // controlli che non sia lo studente stesso ad aver fatto la proposta
                          if (team.id_creator != this.authService.getEmail()) {
                            proposals.push({ idCreator: team.id_creator, groupName: team.name, matricola: student.id, name: student.name, firstName: student.firstName })
                          }
                        })

                        this.dataSourceProposals.data = [...proposals]
                        this.isLoading = false
                      }, (_) => {
                        this.isLoading = false
                      })
                    });
                  } else this.isLoading = false


                }, (_) => this.isLoading = false)

              }

            })

        }, (_) => this.isLoading = false
        )
      }
    })

  }


  setDataSourceAttributes() {
    this.dataSourceStudentNotYetInTeam.paginator = this.paginatorNotInTeam;
    this.dataSourceStudentNotYetInTeam.sort = this.matSortNotInTeam;

    this.dataSourceStudentInTeam.paginator = this._paginatorInTeam;
    this.dataSourceStudentInTeam.sort = this._matSortInTeam;

    this.dataSourceProposals.paginator = this._paginatorProposal;
    this.dataSourceProposals.sort = this._matSortProposal;
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
        this.form.get('timeoutControl').value).subscribe((resp) => {
          if (resp.status === 201) { // Ok created
            // TODO: fill dataSourceProposals with the proposed members in the team

            this.studentService.getProposalsToStudent(this.selectedCourse.name).subscribe(proposedTeams => {


              if (proposedTeams.length != 0) {

                // Add the new proposals 
                let proposals: Proposal[] = []
                proposedTeams.forEach(team => {
                  this.studentService.getTeamMembers(this.selectedCourse.name, team.id).subscribe((studentsInTeamProposed) => {

                    studentsInTeamProposed.forEach(student => {
                      // controlli che non sia lo studente stesso ad aver fatto la proposta
                      if (team.id_creator != this.authService.getEmail())
                        proposals.push({ idCreator: team.id_creator, groupName: team.name, matricola: student.id, name: student.name, firstName: student.firstName })
                    })

                    this.dataSourceProposals.data = [...proposals]
                    this.isLoading = false
                  })
                });
              }
            })
            // Remove students selected
            this.selection.clear()
          } else
            this.isErrorAlertOpen = true
        }, (_) => {
          this.isErrorAlertOpen = true
        })

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
