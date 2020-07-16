import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { TeacherService } from '../services/teacher.service';

@Component({
    selector: 'app-vm',
    templateUrl: './vm.component.html',
    styles: []
})
export class VMComponent implements OnInit {

    displayedColumns: string[] = ['id', 'name', 'status'];
    VMDataSource: MatTableDataSource<object>;

    teams;

    constructor(private teacher: TeacherService) { }

    ngOnInit(): void {

        this.teacher.getSelectedCourse().subscribe(course => {
            this.teams = this.teacher.getTeams(course["name"]).subscribe(data => console.log(data))
        }
        )
    }

}
