import { SelectionModel } from '@angular/cdk/collections';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Course } from 'src/app/model/course.model';
import { Student } from 'src/app/model/student.model';
import { Teacher } from 'src/app/model/teacher.model';
import { TeacherService, VmModel } from 'src/app/services/teacher.service';
import { Message } from '../course-container/course-management-container.component';
import { RemoveCourseDialogComponent } from './dialog/remove-course-dialog.component';

@Component({
  selector: 'app-course-management',
  templateUrl: './course-management.component.html',
  styleUrls: ['./course-management.component.css']
})
export class CourseManagementComponent implements OnInit {


  // File per aggiunta studenti al corso 
  selectedFile: File;

  // Flag bottone di upload per aggiunta studenti con file csv, inizialmente disabilitato
  isDisabled: boolean

  // Flag che indica se il teacher sta modificando i settings del corso: in base a questo flag 
  // vengono nsacosti/mostrati elementi nel DOM relativi alla modifica del corso
  isEditing: Boolean

  // Flag che indica se la selezione nel master toggle deve essere effettuata inizialmente nella singola pagina
  masterToggleInPageOption = true

  // Messaggio settato dal parent component 
  private _message: Message;

  // Messaggio che invece è settato dal dummy component
  msg: string
  alertType: string

  vmModels: VmModel[];


  // Studenti enrolled data source e relative colonne
  enrolledStudentsDataSource: MatTableDataSource<Student>;
  displayedColumns: string[] = ['select', 'id', 'name', 'first name', 'group'];

  // Table selection
  selection = new SelectionModel<Student>(true, []);

  // Autocompletion
  filteredOptions: Observable<Student[]>;

  filteredProfessors: Observable<Teacher[]>;

  /////////// FORMS //////////////
  // Aggiunta studenti
  addStudentForm: FormGroup
  // Modifica settings del corso
  courseSettingForm: FormGroup
  // set vm model
  courseVmModelForm: FormGroup
  // Form per condivisione corso con altri prof
  shareCourseForm: FormGroup


  // Form Control per condivisione del corso con professori (autocomplete)
  professorsControl = new FormControl();

  // Professori disponibili a condivisione del corso 
  profOptions: Teacher[] = []

  ///////////////////////////////

  // Data sources ricevuti dal parent
  private _enrolledStudents: Student[];
  private _studentsNotInCourse: Student[];
  private _courseObj: Course;
  private _availableTeachers: Teacher[];


  // Paginator e sort
  private _paginator: MatPaginator;
  private _sort: MatSort;


  // @ViewChild(MatSidenav) sidenav: MatSidenav;
  // @ViewChild(MatTable) table: MatTable<any>;

  @ViewChild(MatSort, { static: false })
  public set sort(value: MatSort) {
    this._sort = value;
    // Aggirono sort del data source quando settato
    this.enrolledStudentsDataSource.sort = this.sort
  }

  @ViewChild(MatPaginator)
  public set paginator(value: MatPaginator) {
    this._paginator = value;
    // Aggiorno paginator del data source quando settato
    this.enrolledStudentsDataSource.paginator = this.paginator
  }

  @Input()
  public set enrolledStudents(value: Student[]) {
    this._enrolledStudents = [...value];
    // Quando vengono passati dal parent gli studenti enrolled aggiorno data source
    this.enrolledStudentsDataSource.data = [...this.enrolledStudents]
    // Rimuovo le eventuali selezioni
    this.selection.clear()
    // Risetto i messaggi
    this.msg = ""
    this.alertType = ""
  }

  @Input()
  selectedCourse: string

  @Input() public set message(value: Message) {
    this._message = value;
  }

  @Input() public set courseObj(value: Course) {
    // Se cambia corso allora il flag deve essere risettato
    // this.isEditing = false
    // Aggiorno corso selezionato
    this._courseObj = value;

    // Setto i campi del form al valore iniziale corretto
    this.courseSettingForm.setValue({
      min: this.courseObj.min,
      max: this.courseObj.max,
      enabled: this.courseObj.enabled
    })
  }

  @Input()
  public set studentsNotInCourse(value: Student[]) {
    // Aggiorno source studenti not in course e relativi suggerimenti nell'autocomplete
    this._studentsNotInCourse = value;
    console.log(this.studentsNotInCourse);

    this.filteredOptions = this.addStudentForm.get("studentControl").valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value))
    );
  }

  @Input()
  public set availableTeachers(value: Teacher[]) {
    this._availableTeachers = value;

    console.log(this.availableTeachers);

    // aggiorno le opzioni nell'autocomplete
    this.profOptions = value

    /* Filtro elementi nell'autocomplete dei professori */
    this.filteredProfessors = this.professorsControl.valueChanges
      .pipe(
        startWith(''),
        map(value => this._filterProfessors(value))
      );
  }

  // Communicate with container
  @Output() addStudent: EventEmitter<Student> = new EventEmitter<Student>();
  @Output() deleteStudents: EventEmitter<Student[]> = new EventEmitter<Student[]>();
  @Output() enrollManyCsvEvent: EventEmitter<File> = new EventEmitter<File>()
  @Output() updateCourse: EventEmitter<Course[]> = new EventEmitter<Course[]>()
  @Output() setVmModelForCourse: EventEmitter<object> = new EventEmitter<object>()
  @Output() removeCourse: EventEmitter<string> = new EventEmitter<string>()
  @Output() shareCourseWithProf: EventEmitter<string> = new EventEmitter<string>()


  constructor(public dialog: MatDialog, private teacherService: TeacherService) {
    this.enrolledStudentsDataSource = new MatTableDataSource();
    this.isDisabled = true
    this.isEditing = false
    this.msg = ""
    this.alertType = ""

    this.addStudentForm = new FormGroup({
      studentControl: new FormControl(null),
      fileNameControl: new FormControl('')
    })


    this.courseSettingForm = new FormGroup({
      min: new FormControl('', Validators.required),
      max: new FormControl('', Validators.required),
      enabled: new FormControl(false, Validators.required)
    })

    this.courseVmModelForm = new FormGroup({
      vmmodel: new FormControl('', Validators.required),
    })

    this.shareCourseForm = new FormGroup({
      professorsControl: new FormControl(null, Validators.required),
    })

  }

  ////////////////// Lifecycle hooks ////////////////////

  ngOnInit() {

    this.teacherService.getVmModels().subscribe((models: VmModel[]) => this.vmModels = models)

    /* Filtro elementi nell'autocomplete degli studenti */
    this.filteredOptions = this.addStudentForm.get("studentControl").valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value))
    );

    /* Filtro elementi nell'autocomplete dei professori */
    this.filteredProfessors = this.professorsControl.valueChanges
      .pipe(
        startWith(''),
        map(value => this._filterProfessors(value))
      );
  }

  ngAfterViewInit() {
    this.enrolledStudentsDataSource.paginator = this.paginator;
    this.enrolledStudentsDataSource.sort = this.sort;
  }

  //////////////////////////////////////////////////


  ////////// Getters////////////////

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
  public get paginator(): MatPaginator {
    return this._paginator;
  }
  public get sort(): MatSort {
    return this._sort;
  }
  public get availableTeachers(): Teacher[] {
    return this._availableTeachers;
  }
  ////////////////////////////////////


  /**
   * Metodo usato per aggiornare correttamente i filtri nell'autocomplete
   * @param value 
   */
  private matchingStudents(value: string): Student[] {
    // Correct matches: 
    //  - Name
    //  - Name Surname
    //  - ID
    return this.studentsNotInCourse.filter(option => option.id.toLowerCase().indexOf(value) === 0
      || option.name.toLowerCase().indexOf(value) === 0 || option.firstName.toLowerCase().indexOf(value) === 0
      || (option.firstName.toLowerCase() + " " + option.name.toLowerCase()).indexOf(value) === 0)

  }

  /**
 * Metodo usato per aggiornare correttamente i filtri nell'autocomplete per i professori
 * @param value 
 */
  private matchingProf(value: string): Teacher[] {
    // Correct matches: 
    //  - Name
    //  - Name Surname
    //  - ID
    return this.availableTeachers.filter(option => option.id.toLowerCase().indexOf(value) === 0
      || option.name.toLowerCase().indexOf(value) === 0 || option.firstName.toLowerCase().indexOf(value) === 0
      || (option.firstName.toLowerCase() + " " + option.name.toLowerCase()).indexOf(value) === 0)

  }

  /**
   * Metodo che permette di filtrare le opzioni nell'autocomplete
   * @param value 
   */
  private _filter(value: string): Student[] {
    const filterValue = value.toLowerCase();
    return this.matchingStudents(filterValue);
  }


  private _filterProfessors(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.matchingProf(filterValue);
  }

  /** 
   * Whether the number of selected elements matches the total number of rows. 
   */
  private isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.enrolledStudentsDataSource.data.length;
    return numSelected === numRows;
  }

  /**
   * Metodo che in base al flag controlla se sono tutti gli elementi selezionati nella pagina
   * o se invece sono selezionati tutti perchè internamente chiama isAllSelected
   */
  isAllSelectedInPage(): boolean {

    // Controllo che non faccia nulla se il paginator non è settato
    if (!this.paginator) {
      return false
    }
    // In base al flag sono da selezionare solo gli elementi nella pagina o in tutta
    if (this.masterToggleInPageOption) {
      // Definisco gli indici
      let indexStartingElement = this.paginator.pageIndex == 0 ? 0 : (this.paginator.pageIndex * this.paginator.pageSize)
      let indexEndElement = (indexStartingElement + this.paginator.pageSize)

      indexEndElement = indexEndElement > (this.enrolledStudentsDataSource.data.length - 1) ?
        (this.enrolledStudentsDataSource.data.length) : indexEndElement

      // Flag che indica se sono stati selezionati tutti nella pagina
      let allSelected = true

      // Per ogni elemento
      for (let i = indexStartingElement; i < indexEndElement; i++) {
        // Se trova anche solo un elemento non settato ritorno false
        if (!this.selection.isSelected(this.enrolledStudentsDataSource.data[i])) {
          allSelected = false
        }
      }
      return allSelected

    } else return this.isAllSelected()
  }

  /**
   * Metodo che permette di selezionare in base a flag 
   * se selezionare tutti gli studenti nella pagina corrente
   * o se tutti gli studenti in tabella
   */
  toggleSelectionOptionAndSelect() {
    //prima volta che clicco su bottone => Seleziono tutti gli studenti
    if (this.masterToggleInPageOption) {
      this.masterToggleInPageOption = false
      this.masterToggle()
      this.msg = `Tutti i ${this.selection.selected.length} studenti sono stati selezionati.`

    } else {
      //seconda volta che clicco => Annulla
      this.msg = ""
      this.masterToggle()
      this.masterToggleInPageOption = true
    }

  }

  /** 
   * Selects all rows if they are not all selected; otherwise clear selection. 
   * */
  masterToggle() {
    // Controllo che siano selezionati tutti gli studenti che sia in singola pagina o in tutta la tabella
    if (this.isAllSelectedInPage()) {
      // Se sono selezionati devo deselezionare
      this.selection.clear()
      this.msg = ""
      this.alertType = ""
      // Risetto la selezione in pagina singola
      this.masterToggleInPageOption = true
    } else {
      // Se non sono tutti selezionati allora devo controllare il flag e in base a quello selezionare i rimanenti
      // studenti sulla pagina oppure gli elementi in tutta la tabella
      if (this.masterToggleInPageOption) {
        // Definizione indici
        let indexStartingElement = this.paginator.pageIndex == 0 ? 0 : (this.paginator.pageIndex * this.paginator.pageSize)
        let indexEndElement = indexStartingElement + this.paginator.pageSize

        indexEndElement = indexEndElement > (this.enrolledStudentsDataSource.data.length - 1) ? (this.enrolledStudentsDataSource.data.length) : indexEndElement

        for (let i = indexStartingElement; i < indexEndElement; i++) {
          this.selection.select(this.enrolledStudentsDataSource.sortData(this.enrolledStudentsDataSource.data, this.sort)[i])
        }

        // Se i due metodi tornano qualcosa di diverso allora abbiamo selezione in pagina
        if (this.isAllSelected() != this.isAllSelectedInPage()) {
          this.msg = `Tutti i ${this.selection.selected.length} studenti in questa pagina sono stati selezionati.`
          this.alertType = "secondary"
        }
      } else {
        this.enrolledStudentsDataSource.data.forEach(row => this.selection.select(row));
      }
    }
  }

  /**
   * Visualizzazione studenti nell'autocomplete
   * @param student 
   */
  displayWith(student: Student): string {
    return student && student.firstName && student.name && student.id ?
      student.firstName + " " + student.name + " (" + student.id + ")" : '';
  }

  displayProf(teacher: Teacher): string {
    return teacher && teacher.name && teacher.firstName && teacher.id ?
      teacher.firstName + " " + teacher.name + " (" + teacher.id + ")" : '';
  }

  /**
   * Metodo che permette di settare lo studente selezionato nell'autocomplete
   * @param student 
   */
  autocompleteSelected(student: Student) {
    this.addStudentForm.get('studentControl').setValue(student)
  }

  /**
   * Metodo che permette di settare il prof selezionato nell'autocomplete
   * @param teacher
   */
  profSelected(teacher: Teacher) {
    this.shareCourseForm.get('professorsControl').setValue(teacher)
  }


  /**
   * Metodo che permette nel momento in cui avviene l'aggiunta di uno studente di scatenare evento gestito poi dal parent 
   */
  addStudentEvent() {
    if (this.addStudentForm.get("studentControl").value != null) {
      this.addStudent.emit(this.addStudentForm.get("studentControl").value);
      this.addStudentForm.get('studentControl').setValue(null)
    }

  }

  /**
   * Metodo che permette di far visualizzare il pulsante di elimina studenti, in base al numero di studenti selezionati 
   */
  isDeleteButtonDisabled() {
    return this.selection.isEmpty();
  }

  /**
   * Metodo che permette di creare un evento per poter cancellare gli studenti
   */
  _deleteStudents() {
    this.deleteStudents.emit(this.selection.selected)
    this.selection.clear();
  }

  /**
   * Metodo che permette di settare il file CSV per l'aggiunta degli studenti, richiamato ad ogni selezione del file.
   * @param event 
   */
  public onFileChanged(event) {
    //Select File
    this.selectedFile = event.target.files[0];
    this.addStudentForm.get('fileNameControl').setValue(this.selectedFile.name)
    if (this.addStudentForm.get('fileNameControl'))
      this.isDisabled = false
  }

  /*
   * Gets called when the user clicks on submit to upload the image 
   */
  onUpload() {
    this.enrollManyCsvEvent.emit(this.selectedFile);
  }

  /**
   * Metodo che fa il toggle del flag isEditing
   */
  toggleEditSettings() {
    this.isEditing = !this.isEditing
  }

  /**
   * Metodo che permette di emettere un evento per la modifica dei settings di un corso gestito poi dal parent
   */
  confirmSettings() {

    let course = { ...this.courseObj } as Course

    //Corso viene settato in base ai dati del form
    course.min = this.courseSettingForm.get('min').value

    course.max = this.courseSettingForm.get('max').value

    course.enabled = this.courseSettingForm.get('enabled').value

    // evento con nuova versione e vecchia versione 
    this.updateCourse.emit([course, this.courseObj])
  }

  confirmVmModel() {

    if (this.courseVmModelForm.valid)
      this.setVmModelForCourse.emit({ course: this.courseObj, vmModel: this.courseVmModelForm.value.vmmodel })
  }

  /**
   * Metodo che viene chiamata per rimuovere un corso e che richiama un dialog di conferma
   */
  onRemoveCourse() {
    this.openDialog()
  }

  /**
   * Metodo per apertura dialog di conferma rimozione corso
   */
  openDialog(): void {
    const dialogRef = this.dialog.open(RemoveCourseDialogComponent, {
      width: 'auto',
      data: this.selectedCourse
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result)
        this.removeCourse.emit(this.courseObj.name)
    });
  }

  /**
   * Metodo usato per resettare le informazioni da visualizzare all'interno del form dei settings del corso
   */
  resetCourseSettings() {
    this.courseSettingForm.get('min').setValue(this.courseObj.min)
    this.courseSettingForm.get('max').setValue(this.courseObj.max)
    this.courseSettingForm.get('enabled').setValue(this.courseObj.enabled)

    this.isEditing = false
  }

  /**
   * Metodo usato per condividere corso con altro teacher settato nell'autocomplete
   */
  shareCourse() {

    //controllo validità form: se campo settato
    if (this.shareCourseForm.valid) {
      this.shareCourseWithProf.emit((this.shareCourseForm.get('professorsControl').value as Teacher).id)
      this.shareCourseForm.get('professorsControl').setValue(null)
      
    }
  }

}
