import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
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
import { element } from 'protractor';

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


  selectedCourse: string

  selectedAssignment: Assignment

  // id,  state,  isFinal, mark
  homeworksColumnsToDisplay: string[] = ['id', 'state', 'isFinal', 'mark'];
  homeworksDataSource: MatTableDataSource<DisplayedHomework> = new MatTableDataSource<DisplayedHomework>();
  allHomeworks: DisplayedHomework[]

  consegneDisplayedColumns: string[] = ['id', 'releaseDate', 'expirationDate']
  consegneDataSource: MatTableDataSource<Assignment> = new MatTableDataSource<Assignment>();


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

  constructor(private teacherService: TeacherService, private activatedRoute: ActivatedRoute,
    private routeStateService: RouteStateService, private dialog: MatDialog) {
    //chips
    this.filteredOptions = this.optionCtrl.valueChanges.pipe(
      startWith(null),
      map((option: string | null) => option ? this._filter(option) : this.allOptions.slice().sort()));

    this.allHomeworks = []

    this.filterRowsAccordingToOptions()
  }




  //*****************chips methods*******************************//


  add(event: MatChipInputEvent): void {
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

  remove(option: string): void {
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

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params) => {
      if (params['course_name']) {
        this.routeStateService.updatePathParamState(params['course_name'])

        this.selectedCourse = params['course_name']

        this.teacherService.getAssignmentsByCourse(this.selectedCourse).subscribe((assignments: Assignment[]) => {
          let date = new Date().toDateString()
          assignments.push(new Assignment(1, date.toString(), date.toString()))
          this.consegneDataSource = new MatTableDataSource<Assignment>(assignments)


          assignments.forEach(assignment => {

            this.teacherService.getHomeworksByAssignment(this.selectedCourse, assignment.id).subscribe((homeworks: Homework[]) => {

              //******************************TODO: remove fake homeworks***************************************//
              homeworks.push(new Homework(1, states.delivered, false, 25))


              let displayHomeworks: DisplayedHomework[] = []

              /*  unread,
                  read,
                  delivered,
                  reviewed */

              homeworks.forEach(element => {
                let state = ""
                switch (element.state) {
                  case 1:
                    state = "LETTO"
                    break;
                  case 2:
                    state = "CONSEGNATO"
                    break;
                  case 3:
                    state = "RIVISTO"
                    break;

                  default:
                    state = "NON LETTO"
                    break;

                }
                displayHomeworks.push({
                  id: element.id,
                  state: state,
                  isFinal: element.isFinal,
                  mark: element.mark
                })
              })

              this.homeworksDataSource.data = displayHomeworks
              this.allHomeworks = displayHomeworks
            },

              //***************REMOVE THIS BRANCH **************************************/
              (error) => {
                //TODO: remove fake homeworks
                let homeworks: Homework[] = []

                homeworks.push(new Homework(1, states.delivered, false, 25))
                let displayHomeworks: DisplayedHomework[] = []

                homeworks.forEach(element => {
                  let state = ""
                  switch (element.state) {
                    case 1:
                      state = "LETTO"
                      break;
                    case 2:
                      state = "CONSEGNATO"
                      break;
                    case 3:
                      state = "RIVISTO"
                      break;

                    default:
                      state = "NON LETTO"
                      break;
                  }

                  displayHomeworks.push({
                    id: element.id,
                    state: state,
                    isFinal: element.isFinal,
                    mark: element.mark
                  })
                })

                this.homeworksDataSource.data = displayHomeworks
                this.allHomeworks = displayHomeworks

              })
          })
        });
      }

    })


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





