import { Component, OnInit, ElementRef, ViewChild, Input, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Homework } from 'src/app/model/homework.model';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Assignment } from 'src/app/model/assignment.model';
import { MatDialog } from '@angular/material/dialog';
import { HomeworkDialogComponent } from './dialog/homework-dialog.component';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { ENTER, COMMA, V } from '@angular/cdk/keycodes';
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
  studentId: string,
  name: string,
  surname: string,
  state: string,
  timestamp: string
  isFinal: boolean,
  mark: string
}

export interface DisplayedAssignment {
  id: number,
  releaseDate: String,
  expirationDate: String
  isDeletable: boolean
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

  // FIle to be uploaded
  selectedFile: File;
  isDisabled: boolean

  // Alert that is shown to the final user
  message: string;
  alertType: string


  //flag that will be used to add the column actions "teacher side" showing possibly the remove button for an assignment
  isThereAnAssignmentToBeDeleted: boolean


  //DATA SOURCES:
  homeworksColumnsToDisplay: string[] = ['name', 'surname', 'studentId', 'state', 'timestamp', 'mark'];
  homeworksDataSource: Array<MatTableDataSource<DisplayedHomework>>
  allHomeworks: DisplayedHomework[][]

  consegneDisplayedColumns: string[] = ['id', 'releaseDate', 'expirationDate']
  consegneDataSource: MatTableDataSource<DisplayedAssignment>

  private _selectedCourse: string;
  private _displayedAssignments: DisplayedAssignment[];
  private _displayedHomeworks: DisplayedHomework[];

  //Expanded element
  assignmentExpandedElement: Assignment | null;
  homeworkExpandedElement: Homework | null;

  currentTime = new Date()


  selectedDate: Date
  tomorrow: Date = new Date()

  addAssignmentForm: FormGroup


  //********************************CHIPS**************************************/
  visible = true;
  selectable = true;
  removable = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  optionCtrl = new FormControl();
  filteredOptions: Observable<string[]>;
  options: string[];
  allOptions: string[];
  @ViewChild('optionInput') optionInput: ElementRef<HTMLInputElement>;
  @ViewChild('auto') matAutocomplete: MatAutocomplete;
  //*****************************************************************************/


  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort;

  @Input() public set selectedCourse(value: string) {
    this._selectedCourse = value;
  }

  @Input()
  public set displayedAssignments(value: DisplayedAssignment[]) {
    this._displayedAssignments = value;
    this.consegneDataSource.data = [...this.displayedAssignments]
  }

  //nel momento in cui arrivano gli hw allora bisogna assegnarli ai rispettivi assignment
  @Input()
  public set displayedHomeworks(value: DisplayedHomework[]) {

    this._displayedHomeworks = value;


    for (let i = 0; i < this.displayedAssignments.length; i++) {

      // //hws assegnati ad un determinato assignment
      if (this.displayedAssignments[i].isDeletable) {
        this.isThereAnAssignmentToBeDeleted = true
        //E' possibile cancellare un assignment
        if (!this.consegneDisplayedColumns.includes('actions'))
          this.consegneDisplayedColumns.push('actions')
      }

      this.homeworksDataSource.push(new MatTableDataSource<DisplayedHomework>())
      this.allHomeworks.push([])
      let newSource = []

      this.displayedHomeworks.forEach(x => {

        // se l'assignment dell'hw e quello corrente coincidono aggiungi l'hw a questo assignment
        if (x.assignmentId == this.displayedAssignments[i].id) {
          newSource.push(x)
        }
      })
      this.homeworksDataSource[i].data = [...newSource]
      this.allHomeworks[i] = this.homeworksDataSource[i].data
      this.filterRowsAccordingToOptions(this.displayedAssignments[i].id)

    }
  }

  @Output() addedAssignment: EventEmitter<Assignment> = new EventEmitter<Assignment>();

  constructor(
    private dialog: MatDialog,
    private _authService: AuthService,
    private teacherService: TeacherService) {

    let tomorrowTime = new Date()
    tomorrowTime.setDate(this.currentTime.getDate() + 1)

    this.tomorrow = tomorrowTime

    this.selectedDate = this.tomorrow

    this.addAssignmentForm = new FormGroup({
      expirationTime: new FormControl(this.getCurrentMinTime(), [Validators.required]),
      expirationDate: new FormControl(this.tomorrow, Validators.required),
      fileName: new FormControl('', Validators.required),

    });

    //Inizialmente il pulsante di upload è disabilitato
    this.isDisabled = true

    this.homeworksDataSource = new Array<MatTableDataSource<DisplayedHomework>>();
    this.consegneDataSource = new MatTableDataSource<DisplayedAssignment>();
    this.allHomeworks = []

    //Settato inizialmente a false ma ricalcolato nel momento in cui la source viene settata
    this.isThereAnAssignmentToBeDeleted = false

    //aggiorna i filtri relativi alle chips
    this.reinitFilters();

  }

  ngOnInit(): void {
    // On init vengono passati dal container i dati relativi a hws e assignemnts, qui vengono ripartiti e create il giusto numero di righe.
    for (let i = 0; i < this.displayedAssignments.length; i++) {
      //per ogni assignment ho una tabella di hws quindi un datasource di hws
      this.homeworksDataSource.push(new MatTableDataSource<DisplayedHomework>())
      this.allHomeworks.push([])
      let newHwsSource = []


      // dati gli hws assegnati ad un determinato assignment, il container setta anche se l'assignment risulta cancellabile o meno
      if (this.displayedAssignments[i].isDeletable) {
        // Se c'è allora è necessario aggiungere nella tabella una colonna in cui sarà possibile aggiungere il bottone di delete in base alle condizioni
        this.isThereAnAssignmentToBeDeleted = true
        // Aggiungi la colonna solo se non già presente
        if (!this.consegneDisplayedColumns.includes('actions'))
          this.consegneDisplayedColumns.push('actions')
      }


      // gli hws vengono ricevuti tutti insieme, ma ripartiti in base all'assignment
      this.displayedHomeworks.forEach(x => {
        if (x.assignmentId == this.displayedAssignments[i].id) {
          newHwsSource.push(x)
        }
      })

      // Aggiornamento data source hws 
      this.homeworksDataSource[i].data = [...newHwsSource]
      //variabile usata poi coi filtri
      this.allHomeworks[i] = this.homeworksDataSource[i].data
      // visualizzare gli hws in base ai filtri iniziali
      this.filterRowsAccordingToOptions(this.displayedAssignments[i].id)
    }
    // Aggiornamento data source assignment 
    this.consegneDataSource.data = this.displayedAssignments;

  }

  ngAfterViewInit() {
    //paginator e sort vengono settati dopo che la view risulta essere inizializzata
    this.consegneDataSource.paginator = this.paginator;
    this.consegneDataSource.sort = this.sort;
  }


  public get selectedCourse(): string {
    return this._selectedCourse;
  }

  public get displayedHomeworks(): DisplayedHomework[] {
    return this._displayedHomeworks;
  }

  public get displayedAssignments(): DisplayedAssignment[] {
    return this._displayedAssignments;
  }

  public get authService(): AuthService {
    return this._authService;
  }

  getCurrentMinTime(): string {
    if (this.selectedDate.getDate() === this.tomorrow.getDate())
      return `${this.tomorrow.getHours()}:${this.tomorrow.getMinutes()}`
    else
      return "00:00"
  }

  changeSelectedDate(value: Date) {

    let current = new Date()
    value.setHours(current.getHours())
    value.setMinutes(current.getMinutes())

    this.selectedDate = value

    if (this.selectedDate.getDate() === this.tomorrow.getDate()) {

      let time = this.addAssignmentForm.get('expirationTime').value.split(":")
      let selectedHour = Number(time[0])
      let selectedMinutes = Number(time[1])


      if (this.selectedDate.getHours() >= selectedHour && this.selectedDate.getMinutes() >= selectedMinutes)
        this.addAssignmentForm.patchValue({ expirationTime: this.getCurrentMinTime() })

    }
  }



  /**
   * Funzione usata per rinizializzare i filtri delle chips, è chiamata on init, e ogni volta che viene selezionato un nuovo assignment
   * Lo scopo è filtrare gli hw di un determinato assignemnt in base al suo stato
   */
  private reinitFilters(): void {
    this.options = ['LETTO', 'NON LETTO', 'RIVISTO', 'CONSEGNATO', 'REGISTRATO'];
    this.allOptions = [];
    this.filteredOptions = this.optionCtrl.valueChanges.pipe(
      startWith(null),
      map((option: string | null) => option ? this._filter(option) : this.allOptions.slice().sort()));
  }



  /**
   * Funzione chiamata nel momento in cui un teacher vuole aggiungere un assignemnt.
   * Viene fatto il controllo di validazione e se positivo invia la richiesta
   */
  submit() {
    if (this.addAssignmentForm.valid) {

      //FormData API provides methods and properties to allow us easily prepare form data to be sent with POST HTTP requests.
      const formData = new FormData();

      let timestamp: Date = this.addAssignmentForm.get("expirationDate").value

      let time: string = this.addAssignmentForm.get("expirationTime").value

      timestamp.setHours(Number(time.split(":")[0]), Number(time.split(":")[1]), 0, 0)


      formData.append('assignment', new Blob([JSON.stringify({ expirationDate: timestamp })], {
        type: "application/json"
      }))


      formData.append('image', this.selectedFile, this.addAssignmentForm.get('fileName').value);


      this.teacherService.addAssignment(this.selectedCourse, formData).subscribe(success => {
        this.addedAssignment.emit(success)

        this.message = "The assignment was successfully added."
        this.alertType = "success"
      })
    }
  }



  //*****************CHIPS methods*******************************//

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


  /** 
   * Metodo usato per filtrare gli hws dell'assignment selezionato
   * @param assignmentId 
  */
  private filterRowsAccordingToOptions(assignmentId: number) {
    let i = this.displayedAssignments.findIndex(assignment => assignment.id == assignmentId)
    let filteredDataSource = this.allHomeworks[i]
    filteredDataSource = filteredDataSource.filter(element => this.options.includes(element.state))
    this.homeworksDataSource[i].data = filteredDataSource
  }


  /** 
   * Metodo usato per selezionare un assignemnt ---> riinizializzazione dei filtri
  */
  selectAssignment(assignment: Assignment) {
    //assignmentExpandedElement === assignment ? null : assignment
    this.assignmentExpandedElement = this.assignmentExpandedElement === assignment ? null : assignment

    this.reinitFilters();
  }

  /** 
   * Metodo chiamato on click di un determinato assignment per visualizzare un popup con i dettagli
  */
  seeHomeworkVersions(homework: DisplayedHomework) {


    const dialogRef = this.dialog.open(HomeworkDialogComponent, {
      height: '95%',
      width: '95%',
      data: {
        assignment: this.assignmentExpandedElement,
        homework: homework
      }
    });
    event.stopPropagation();
  }

  //Gets called when the user selects an image
  onFileChanged(event) {
    //Select File
    this.selectedFile = event.target.files[0]
    this.addAssignmentForm.patchValue({ fileName: this.selectedFile.name });

    if (this.addAssignmentForm.get('fileName').value)
      this.isDisabled = false
  }


  /**
   * Metodo chiamato per cancellare un assignment
   * @param assignment 
   */
  deleteAssignment(assignment: DisplayedAssignment) {

    this.teacherService.removeAssignment(this.selectedCourse, assignment.id).subscribe(
      success => {
        this.displayedAssignments = this.displayedAssignments.filter(a => a.id != assignment.id)
        this.message = "The assignment was successfully deleted"
        this.alertType = "success"
        // Viene controllato e nel caso aggiornata la tabella per poter rimuovere la colonna actions
        this.checkIfAreThereAssignmentTobeDeleted()
      },
      error => {
        this.message = "Something went wrong try later..."
        this.alertType = "danger"
      })

  }

  /** 
   * Metodo chiamato per poter controllare che ci siano ancora altri assignment da cancellare, e aggiornare la tabella di conseguenza
  */
  private checkIfAreThereAssignmentTobeDeleted() {

    let isThereAnAssignmentToBeDeleted = false

    for (let i = 0; i < this.displayedAssignments.length; i++) {
      // //hws assegnati ad un determinato assignment
      if (this.displayedAssignments[i].isDeletable) {
        //E' possibile cancellare un assignment
        isThereAnAssignmentToBeDeleted = true

        // E' ancora possibile cancellare un assignment
        if (!this.consegneDisplayedColumns.includes('actions'))
          this.consegneDisplayedColumns.push('actions')
      }
    }


    // Se non è possibile cancellare un assignment
    if (!isThereAnAssignmentToBeDeleted)
      this.consegneDisplayedColumns.pop() //rimozione della colonna actions

    return this.isThereAnAssignmentToBeDeleted = isThereAnAssignmentToBeDeleted
  }


}





