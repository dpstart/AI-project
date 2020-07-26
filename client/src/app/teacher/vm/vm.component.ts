import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { TeacherService } from '../services/teacher.service';
import { Team } from '../model/team.model';
import { animate, state, style, transition, trigger } from '@angular/animations';


@Component({
    selector: 'app-vm',
    templateUrl: './vm.component.html',
    styles: [],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ]
})
export class VMComponent implements OnInit {

    columnsToDisplay: string[] = ['actions', 'name', 'id', 'disk_space', 'ram'];
    dataSource: MatTableDataSource<Team> = new MatTableDataSource<Team>();

    expandedElement: Team | null;


    constructor(private teacher: TeacherService) { }

    getVMs() {

        this.dataSource.data.forEach(element => {

            this.teacher.getVMs(element.id).subscribe(data => console.log(data))

        });

    }

    ngOnInit(): void {

        this.teacher.getTeams(this.teacher.getSelectedCourse()).subscribe((data: Team[]) => {
            this.dataSource.data = data;
            this.getVMs();
        })
    }

}
