import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Homework, states } from 'src/app/model/homework.model';
import { TeacherService } from 'src/app/services/teacher.service';
import { trigger, state, style, transition, animate } from '@angular/animations';

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

  // id,  state,  isFinal, mark
  columnsToDisplay: string[] = ['id', 'state', 'isFinal', 'mark'];
  dataSource: MatTableDataSource<Homework> = new MatTableDataSource<Homework>();



  expandedElement: Homework | null;

  constructor(private teacherService: TeacherService) { }

  ngOnInit(): void {

    this.teacherService.getHomeworks(this.teacherService.getSelectedCourse()).subscribe((homeworks: Homework[]) => {

      //TODO: remove fake homeworks
      homeworks.push(new Homework(1, states.delivered, false, 25))
      this.dataSource = new MatTableDataSource<Homework>(homeworks)
    })
  }

}
