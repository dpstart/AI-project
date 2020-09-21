import { Component, OnInit, ViewChild, AfterViewInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { StudentService, ServerError } from 'src/app/services/student.service';
import { Student } from 'src/app/model/student.model';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { SelectionModel } from '@angular/cdk/collections';
import { Course } from 'src/app/model/course.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { RouteStateService } from 'src/app/services/route-state.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})
export class GroupsComponent implements OnInit, OnDestroy {

  studentsInTeam: Student[];

  selectedCourse: Course;

  // Table selection
  selection = new SelectionModel<Student>(true, []);

  // button is enabled 
  isDisabled: boolean

  //Tables related properties
  dataSourceStudentInTeam: MatTableDataSource<Student>
  dataSourceStudentNotYetInTeam: MatTableDataSource<Student>
  displayedColumnsNotInTeam: string[]
  expandedStudent: Student | null;
  expandedProposal: Proposal | null;

  //Table of proposals:
  dataSourceProposals: MatTableDataSource<Proposal>
  displayedColumnsProposals: string[]

  //innerTable of members of a proposal:
  dataSourceMembersProposal: MatTableDataSource<MemberOfProposal>[]
  displayedColumnsMembers: string[]
  displayedColumnsInTeam: string[]


  // Form aggiunta gruppi
  form: FormGroup

  isLoading: boolean // loading


  //Alert for notification
  message: string
  alertType: string

  // flag used to upload different pages
  isInTeam: boolean


  /////paginators of tables//////
  private paginatorNotInTeam: MatPaginator;
  private matSortNotInTeam: MatSort;

  private _paginatorInTeam: MatPaginator;
  private _matSortInTeam: MatSort;

  private _paginatorProposal: MatPaginator;
  private _matSortProposal: MatSort;
  //////////////////////


  courseSub: Subscription;


  constructor(
    private activatedRoute: ActivatedRoute,
    private _studentService: StudentService,
    private _authService: AuthService,
    private routeStateService: RouteStateService,
    private router: Router) {
    this.message = ""
    this.alertType = "danger"
  }



  ngOnInit(): void {
    this.courseSub = this.activatedRoute.params.subscribe(params => {
      if (params['course_name']) {

        this.isInTeam = false // inizializzato a false indica che lo studente non è in un team
        this.isLoading = true // caricamento 
        this.isDisabled = true // indica se il bottone può essere premuto o meno

        //students table
        this.studentsInTeam = []
        this.dataSourceStudentInTeam = new MatTableDataSource<Student>();
        this.dataSourceStudentNotYetInTeam = new MatTableDataSource<Student>();
        this.displayedColumnsNotInTeam = ['select', 'id', 'name', 'firstName', 'group'];

        //proposals table
        this.dataSourceProposals = new MatTableDataSource()
        this.displayedColumnsProposals = ['idCreator', 'groupName', 'name', 'firstName'];
        this.displayedColumnsInTeam = ['group', 'id', 'name', 'firstName']

        //inner members table
        this.dataSourceMembersProposal = []
        this.displayedColumnsMembers = ['id', 'name', 'firstName', 'status']

        // Inizializzazione form per i gruppi
        this.form = new FormGroup({
          groupNameControl: new FormControl('', [Validators.required]),
          timeoutControl: new FormControl(10, [Validators.required, Validators.min(10)]) //10 min
        })

        // Update the course into the service so that all the other components will know it
        this.routeStateService.updatePathParamState(params['course_name'])

        //ritira info corso
        this.studentService.getCourse(params["course_name"]).subscribe((selectedCourse: Course) => {
          this.selectedCourse = selectedCourse;

          //ritira team del corso
          this.studentService.getTeamForCourse(this.selectedCourse.name).subscribe(
            (teams) => {
              //se i team non sono settati (null) === lo studente non è in un team 
              if (!teams) {
                this.isInTeam = false

                //students is not yet in team: we have to upload in the table only the students that are not in a team
                this.studentService.getStudentsAvailableInCourse(this.selectedCourse.name).subscribe((studentsNotInTeam: Student[]) => {


                  //Filtro lo studente che fa la richiesta
                  studentsNotInTeam = studentsNotInTeam.filter((student) => student.id != this.authService.getId())

                  //aggiorno source
                  this.dataSourceStudentNotYetInTeam.data = [...studentsNotInTeam]
                }, (_) => this.isLoading = false
                )


                // Proposte ricevute dallo studente in questione
                this.studentService.getProposalsToStudent(this.selectedCourse.name).subscribe(proposedTeams => {

                  // Ha ricevuto richieste?
                  if (proposedTeams.length != 0) {

                    // Add the new proposals 
                    let proposals: Proposal[] = [];


                    //per ogni team proposto
                    for (let i = 0; i < proposedTeams.length; i++) {

                      this.dataSourceMembersProposal.push(new MatTableDataSource<MemberOfProposal>());

                      // prendiamo i membri della proposta per un team
                      this.studentService.getTeamMembers(this.selectedCourse.name, proposedTeams[i].id).subscribe((studentsInTeamProposed) => {


                        let members: MemberOfProposal[] = [];

                        // ottenieamo info riguardo allo stato di adesione del team in questione
                        this.studentService.getAdhesionInfo(this.selectedCourse.name, proposedTeams[i].id).subscribe((data) => {

                          studentsInTeamProposed.forEach((member) => {
                            members.push({ id: member.id, name: member.name, firstname: member.firstName, statusToken: data[member.id] });
                          });

                          //Prendi info riguardo allo studente in questione
                          this.studentService.getStudentById(proposedTeams[i].id_creator).subscribe(creator => {
                            proposals.push(
                              {
                                row: i,
                                idCreator: proposedTeams[i].id_creator,
                                groupName: proposedTeams[i].name,
                                name: creator.name,
                                firstName: creator.firstName,
                                members: members
                              });


                            //Una volta ottenute tutte le informazioni aggiorna il data source
                            this.dataSourceProposals.data = [...proposals];
                            this.dataSourceMembersProposal[i].data = [...members];

                            this.isLoading = false;
                          });

                        });
                      }, (_) => {
                        this.isLoading = false;
                      });
                    }
                  }
                  else
                    this.isLoading = false;
                }, (_) => this.isLoading = false);
              } else {
                //Se teams è settato semplicemente ci dice che lo studente è in un team.
                this.isInTeam = true
                this.isLoading = false

                // Ritiriamo informazioni riguardo ai membri:
                this.studentService.getTeamMembers(this.selectedCourse.name, teams.id).subscribe((students) => {

                  students.forEach(element => {
                    element["group"] = teams.name
                  });
                  this.dataSourceStudentInTeam.data = [...students]
                })
              }
            })

        }, (_) => this.router.navigate(['PageNotFound'])
        )
      }
    })

  }
  ngOnDestroy(): void {
    this.courseSub.unsubscribe()
  }

  // GETTERS
  public get authService(): AuthService {
    return this._authService;
  }


  public get studentService(): StudentService {
    return this._studentService;
  }
  /////////////////

  /////////////VIEWCHILDS/////////////////
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
  ///////////////////////////////////


  /** 
   * Metodo che setta i paginator e i sort coerentemente
  */
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
    this.checkValidity() // l'aggiunta al gruppo è permessa se e solo se i vincoli sono rispettati
  }

  /**
   * Metodo che definisce se la proposta per un team risulta valida oppure no.
   */
  checkValidity() {
    let numSelected = this.selection.selected.length

    if (this.selectedCourse.min <= (numSelected + 1) && (numSelected + 1) <= this.selectedCourse.max && this.form.valid) {
      // proposal valida allora abilito bottone
      this.isDisabled = false
    } else {
      // proposal invalida allora disabilito bottone
      this.isDisabled = true
    }

  }

  /**
   * Metodo utilizzato per accettare o rifiutare una proposta ricevuta
   * @param member 
   * @param isAccepted 
   */
  actionToken(member: MemberOfProposal, isAccepted: boolean) {

    this.studentService.actionToken(member.statusToken, isAccepted).subscribe(result => {
      this.message = isAccepted ? "The proposal was successfully accepted" : "The proposal was successfully rejected"
      this.alertType = 'success'
      this.closeAlertAfterTime(3000)
      this.ngOnInit()
    }, (_) => {

      this.message = "Sorry your view was not up to date..."
      this.alertType = 'danger'
      this.closeAlertAfterTime(3000)
      this.ngOnInit() // riaggiorno la vista
    })

  }

  /**
   * Metodo usato per fare una proposta per un determinato team 
   */
  onSubmit() {

    // Check if all fields are correctly setted.
    if (!this.isDisabled) {
      //avendo fatto accesso a questa pagina qui il metodo getSelf può ritornare solo uno studente
      this.authService.getSelf().subscribe((student: Student) => {
        let studentsForProposal = [...this.selection.selected]

        studentsForProposal.push(student)

        // Proponi team con la configurazione presente
        this.studentService.proposeTeam(this.selectedCourse.name,
          this.form.get('groupNameControl').value,
          studentsForProposal,
          this.form.get('timeoutControl').value).subscribe((resp) => {
            if (resp.status === 201) { // Ok created

              // La richiesta è per un solo membro
              if (this.selection.selected.length == 0) {
                this.alertType = "success"
                this.message = "Team proposal successfully created"
                this.closeAlertAfterTime(3000)
                this.ngOnInit()
                return;
              }

              this.dataSourceMembersProposal.push(new MatTableDataSource<MemberOfProposal>())

              this.authService.getSelf().subscribe((me: Student) => {

                //prendo gli studenti che dovrebbero far parte del team
                let selected = this.selection.selected

                //aggiungo lo studente che fa la proposal tra i selezionati
                selected.push(me)

                let members: MemberOfProposal[] = []
                //Per ogni membro
                selected.forEach((member) => {
                  //Se lo studente coincide con chi fa la richiesta allora ho già accettato, altrimenti no
                  let status = member.id == me.id ? "true" : "false"
                  members.push({ id: member.id, name: member.name, firstname: member.firstName, statusToken: status })
                })
                //aggiungo una proposal 
                let proposal = {
                  row: this.dataSourceMembersProposal.length - 1, // proposal viene aggiunta al fondo
                  idCreator: me.id,
                  groupName: this.form.get('groupNameControl').value,
                  name: me.name,
                  firstName: me.firstName,
                  members: members
                }

                // aggiorno data sources e deseleziono membri
                this.dataSourceProposals.data = [...this.dataSourceProposals.data, proposal]
                this.dataSourceMembersProposal[this.dataSourceMembersProposal.length - 1].data = [...members]
                this.alertType = "success"
                this.message = "Team proposal successfully created"
                this.closeAlertAfterTime(3000)
                this.selection.clear()

              })

            } else {
              // Risposta diversa da 201
              this.alertType = "danger"
              this.message = "Sorry something went wrong, try later..."
              this.closeAlertAfterTime(3000)
              this.selection.clear()
            }
          }, (error) => {
            this.alertType = "danger"
            this.message = error.message
            this.closeAlertAfterTime(3000)
            this.selection.clear()
          })
      })
    }
  }

  /**
   * Utility function used to close alert after tot milliseconds 
   * @param milliseconds 
   */
  closeAlertAfterTime(milliseconds: number) {
    setTimeout(_ => {
      this.message = ""
      this.alertType = ""
    }, milliseconds)
  }
}

export interface Proposal {
  row: number
  idCreator: string
  groupName: string
  name: string
  firstName: string
  members: MemberOfProposal[]
}
export interface MemberOfProposal {
  id: string
  name: string
  firstname: string
  statusToken: string
}

export interface StudentInGroup {
  group: string
  student: Student
}
