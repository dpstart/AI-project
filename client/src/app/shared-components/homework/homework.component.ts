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
import { SafeResourceUrl } from '@angular/platform-browser';


// Interfaccia usata per visualizzazione oggetti hw
export interface DisplayedHomework {
  assignmentId: number,
  homeworkId: number,
  studentId: string,
  name: string,
  surname: string,
  rawState: number,
  state: string,
  timestamp: string,
  timestampObj: Date,
  isFinal: boolean,
  mark: string
}


// Interfaccia usata per visualizzazione oggetti Assignment
export interface DisplayedAssignment {
  id: number,
  releaseDate: String,
  expirationDate: String,
  expirationDateObj: Date,
  srcImage: SafeResourceUrl,
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


  //Immagine che viene espansa on click
  expandedAssignment: any

  // FIle to be uploaded
  selectedFile: File;
  isDisabled: boolean

  // Alert that is shown to the final user
  message: string;
  alertType: string


  //flag that will be used to add the column actions "teacher side" showing possibly the remove button for an assignment
  isThereAnAssignmentToBeDeleted: boolean


  //HW DATA SOURCE:
  homeworksColumnsToDisplay: string[] = ['studentId', 'name', 'surname', 'state', 'timestamp', 'mark'];
  homeworksDataSource: Array<MatTableDataSource<DisplayedHomework>>
  // Per ogni assignemnt vengono salvati tutti gli hws per poterli filtrare in base alle chips
  allHomeworks: DisplayedHomework[][]

  // Assignment data source:
  consegneDisplayedColumns: string[] = ['image', 'releaseDate', 'expirationDate']
  consegneDataSource: MatTableDataSource<DisplayedAssignment>

  // Parametri passati dal componente padre
  private _selectedCourse: string;
  private _displayedAssignments: DisplayedAssignment[];
  private _displayedHomeworks: DisplayedHomework[];
  /////////////////////

  // Paginator e sort degli assignment
  private _paginator: MatPaginator;
  private _sort: MatSort;


  //Expanded element
  assignmentExpandedElement: DisplayedAssignment | null;
  homeworkExpandedElement: DisplayedHomework | null;

  // Date usate per definire poi data assignemnt 
  currentTime = new Date()
  selectedDate: Date
  tomorrow: Date = new Date()

  // Form relativo all'assignment
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



  @ViewChild(MatPaginator)
  public set paginator(value: MatPaginator) {
    this._paginator = value;
    this.consegneDataSource.paginator = this.paginator
  }

  @ViewChild(MatSort, { static: false })
  public set sort(value: MatSort) {
    this._sort = value;
    this.consegneDataSource.sort = this.sort
  }


  @Input() public set selectedCourse(value: string) {
    this._selectedCourse = value;
  }

  @Input()
  public set displayedAssignments(value: DisplayedAssignment[]) {
    this._displayedAssignments = value;
    //Aggiorno assignment dataSource
    this.consegneDataSource.data = [...this.displayedAssignments]
  }

  //nel momento in cui arrivano gli hw allora bisogna assegnarli ai rispettivi assignment
  @Input()
  public set displayedHomeworks(value: DisplayedHomework[]) {

    this._displayedHomeworks = value;

    //Per ogni assignment
    for (let i = 0; i < this.displayedAssignments.length; i++) {

      // Controllo se l'assignemnt può essere cancellato
      if (this.displayedAssignments[i].isDeletable) {
        this.isThereAnAssignmentToBeDeleted = true //flag
        //E' possibile cancellare un assignment, allora devo aggiungere la colonna del bottone
        if (!this.consegneDisplayedColumns.includes('actions'))
          this.consegneDisplayedColumns.push('actions')
      }

      //Inizializzo corrispondente riga
      this.homeworksDataSource.push(new MatTableDataSource<DisplayedHomework>())
      this.allHomeworks.push([])
      let newSource = []


      this.displayedHomeworks.forEach(x => {
        //hws assegnati ad un determinato assignment
        // se l'assignment dell'hw e quello corrente coincidono aggiungi l'hw a questo assignment
        if (x.assignmentId == this.displayedAssignments[i].id) {
          newSource.push(x)
        }
      })

      // Aggiorno il source di quella riga
      this.homeworksDataSource[i].data = [...newSource]
      this.allHomeworks[i] = this.homeworksDataSource[i].data
      this.filterRowsAccordingToOptions(this.displayedAssignments[i].id)
    }
  }

  //Evento emesso verso il componente padre mappato su onInit
  @Output() addedAssignment: EventEmitter<Assignment> = new EventEmitter<Assignment>();

  constructor(
    private dialog: MatDialog,
    private _authService: AuthService,
    private teacherService: TeacherService) {

    let tomorrowTime = new Date()
    tomorrowTime.setDate(this.currentTime.getDate() + 1)

    // Tomorrow
    this.tomorrow = tomorrowTime

    //Data da visualizzare ora è tomorrow
    this.selectedDate = this.tomorrow

    this.addAssignmentForm = new FormGroup({
      expirationTime: new FormControl(this.getCurrentMinTime(), [Validators.required]),
      expirationDate: new FormControl(this.tomorrow, Validators.required),
      fileName: new FormControl('', Validators.required),

    });

    //Inizialmente il pulsante di upload è disabilitato
    this.isDisabled = true

    // Inizializzo data sources
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
      let newHwsSource: DisplayedHomework[] = []


      // dati gli hws assegnati ad un determinato assignment, il container setta anche se l'assignment risulta cancellabile o meno
      if (this.displayedAssignments[i].isDeletable) {
        // Se c'è allora è necessario aggiungere nella tabella una colonna in cui sarà possibile aggiungere il bottone di delete in base alle condizioni
        this.isThereAnAssignmentToBeDeleted = true
        // Aggiungi la colonna solo se non già presente
        if (!this.consegneDisplayedColumns.includes('actions'))
          this.consegneDisplayedColumns.push('actions')
      }


      // gli hws vengono ricevuti tutti insieme, ma vengono ripartiti qui in base all'assignment
      this.displayedHomeworks.forEach(x => {
        if (x.assignmentId == this.displayedAssignments[i].id) {
          newHwsSource.push(x)
        }
      })

      // Ordino gli hws in base al loro stato, policy definita qui in base ai valori settati nel componente padre

      newHwsSource = newHwsSource.sort((a, b) => {
        // Se il loro stato è lo stesso allora ordino in base al tempo
        if (a.rawState === b.rawState) {
          return a.timestampObj.getTime() - b.timestampObj.getTime()
        } else {
          //altrimenti
          return b.rawState - a.rawState
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


  // GETTERS
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

  public get paginator(): MatPaginator {
    return this._paginator;
  }
  public get sort(): MatSort {
    return this._sort;
  }

  //////////////////////////////////



  //** Metodo utilizzato per definire qual è l'ora minima da dover usare nel caricamento di un assignment,
  // In pratica si facilita lo user non permettenedogli di usare date che non sono ammissibili */ 
  getCurrentMinTime(): string {
    if (this.selectedDate.getDate() === this.tomorrow.getDate())
      return `${this.tomorrow.getHours()}:${this.tomorrow.getMinutes()}`
    else
      return "00:00"
  }

  //Data è stata modificata per il caricamento di un assignment
  changeSelectedDate(value: Date) {

    let current = new Date()
    //setto data e ora al momento corrente
    value.setHours(current.getHours())
    value.setMinutes(current.getMinutes())

    this.selectedDate = value

    //Se risetto la data al valore minimo ammissibile (si danno 24 ore minimo agli studenti per svolgere un assignment)
    if (this.selectedDate.getDate() === this.tomorrow.getDate()) {

      let time = this.addAssignmentForm.get('expirationTime').value.split(":")
      let selectedHour = Number(time[0])
      let selectedMinutes = Number(time[1])

      // Se le ore che erano state precedentemente settate non sono valide, setta quelle che sono invece valide
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

      // Setto ore e minuti in base ai valori settati nel campo expiration time
      timestamp.setHours(Number(time.split(":")[0]), Number(time.split(":")[1]), 0, 0)


      // Aggiungo dati assignment al form 
      formData.append('assignment', new Blob([JSON.stringify({ expirationDate: timestamp })], {
        type: "application/json"
      }))


      // aggiungo immagine relativa ad assignment
      formData.append('image', this.selectedFile, this.addAssignmentForm.get('fileName').value);


      // Aggiungo assignment
      this.teacherService.addAssignment(this.selectedCourse, formData).subscribe(success => {
        //Serve per riaggiornare il data source
        this.addedAssignment.emit(success)
        //Avviso utente
        this.message = "The assignment was successfully added."
        this.alertType = "success"
        this.closeAlertAfterTime(3000)
      }, error => {
        //Avviso utente
        this.message = error.message
        this.alertType = "danger"
        this.closeAlertAfterTime(3000)
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
  selectAssignment(assignment: DisplayedAssignment) {
    //assignmentExpandedElement === assignment ? null : assignment
    this.assignmentExpandedElement = this.assignmentExpandedElement === assignment ? null : assignment


    //Definire l'immagine che deve essere ingrandita
    if (assignment == this.expandedAssignment)
      this.expandedAssignment = null
    else
      this.expandedAssignment = assignment

    this.reinitFilters();
    this.filterRowsAccordingToOptions(assignment.id)
  }

  /** 
   * Metodo chiamato on click di un determinato assignment per visualizzare un popup con i dettagli
  */
  seeHomeworkVersions(homework: DisplayedHomework) {
    const dialogRef = this.dialog.open(HomeworkDialogComponent, {
      height: 'auto',
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
        this.closeAlertAfterTime(3000)
        // Viene controllato e nel caso aggiornata la tabella per poter rimuovere la colonna actions
        this.checkIfAreThereAssignmentTobeDeleted()
      },
      error => {
        this.message = "Something went wrong try later..."
        this.alertType = "danger"
        this.closeAlertAfterTime(3000)
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





