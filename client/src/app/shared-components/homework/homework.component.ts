import { Component, OnInit, ElementRef, ViewChild, Input } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Homework, states } from 'src/app/model/homework.model';
import { TeacherService } from 'src/app/services/teacher.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Assignment } from 'src/app/model/assignment.model';
import { ActivatedRoute } from '@angular/router';
import { RouteStateService } from 'src/app/services/route-state.service';
import { MatDialog } from '@angular/material/dialog';
import { HomeworkDialogComponent } from './dialog/homework-dialog.component';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { startWith, map } from 'rxjs/operators';
import { MatChipInputEvent } from '@angular/material/chips';

export interface DisplayedHomework {
  id: number,
  state: string,
  isFinal: boolean,
  mark: number
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
export class HomeworkComponent implements OnInit {



  selectedAssignment: Assignment

  // id,  state,  isFinal, mark
  homeworksColumnsToDisplay: string[] = ['id', 'state', 'isFinal', 'mark'];
  homeworksDataSource: MatTableDataSource<DisplayedHomework>
  allHomeworks: DisplayedHomework[]

  consegneDisplayedColumns: string[] = ['id', 'releaseDate', 'expirationDate']
  consegneDataSource: MatTableDataSource<Assignment>


  @Input() selectedCourse: string
  @Input() assignments: Assignment[]
  @Input() displayedHomeworks: DisplayedHomework[]

  assignmentExpandedElement: Assignment | null;

  homeworkExpandedElement: Homework | null;



  //***********chips
  visible = true;
  selectable = true;
  removable = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  optionCtrl = new FormControl();
  filteredOptions: Observable<string[]>;
  options: string[] = ['LETTO', 'NON LETTO', 'RIVISTO', 'CONSEGNATO'];
  allOptions: string[] = [];



  @ViewChild('optionInput') optionInput: ElementRef<HTMLInputElement>;
  @ViewChild('auto') matAutocomplete: MatAutocomplete;

  //************ */

  constructor(private dialog: MatDialog) {

    this.homeworksDataSource = new MatTableDataSource<DisplayedHomework>();
    this.consegneDataSource = new MatTableDataSource<Assignment>();


    //chips
    this.filteredOptions = this.optionCtrl.valueChanges.pipe(
      startWith(null),
      map((option: string | null) => option ? this._filter(option) : this.allOptions.slice().sort()));

    this.allHomeworks = []

    this.filterRowsAccordingToOptions()
  }




  ngOnInit(): void {

    console.log(this.assignments,this.displayedHomeworks)
    this.homeworksDataSource.data = [...this.displayedHomeworks];
    this.consegneDataSource.data = [...this.assignments];
    this.allHomeworks = [...this.displayedHomeworks]
  }


  //*****************chips methods*******************************//


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

  removeOption(option: string): void {
    const index = this.options.indexOf(option);
    this.allOptions.push(option);

    this.optionCtrl.setValue(null);

    if (index >= 0) {
      this.options.splice(index, 1);
    }

    this.filterRowsAccordingToOptions()
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.options.push(event.option.viewValue);
    this.allOptions.splice(this.allOptions.indexOf(event.option.viewValue), 1)
    this.optionInput.nativeElement.value = '';
    this.optionCtrl.setValue(null);

    this.filterRowsAccordingToOptions()
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.allOptions.filter(option => option.toLowerCase().indexOf(filterValue) === 0);
  }

  //****************************************************//


  private filterRowsAccordingToOptions() {
    let filteredDataSource = [...this.allHomeworks]
    filteredDataSource = filteredDataSource.filter(element => this.options.includes(element.state))
    this.homeworksDataSource.data = [...filteredDataSource]
  }



  selectAssignment(assignment: Assignment) {
    //assignmentExpandedElement === assignment ? null : assignment
    console.log("assignment: ", assignment)
    this.selectedAssignment = assignment
  }
  seeHomeworkDetails(homework: Homework) {

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

}





