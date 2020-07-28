import { Component, OnInit, Inject } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { TeacherService } from '../../services/teacher.service';
import { Team } from '../../model/team.model';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EditTeamDialogComponent } from './edit/edit-team-dialog.component';



@Component({
    selector: 'app-vm',
    templateUrl: './vm.component.html',
    styleUrls: ['./vm.component.css'],
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
    innerDisplayedColumns = ['id', 'n_cpu', 'disk_space', 'ram', 'status'];
    dataSourceTeams: MatTableDataSource<any> = new MatTableDataSource<any>();

    expandedElement: Team | null;



    constructor(private teacher: TeacherService, private dialog: MatDialog) { }

    openEditDialog(element, event): void {

        console.log(element);
        const dialogRef = this.dialog.open(EditTeamDialogComponent, {
            width: '250px',
            data: { team: element }
        });
        event.stopPropagation();
    }

    ngOnInit(): void {

        this.teacher.getTeams(this.teacher.getSelectedCourse()).subscribe((data: Team[]) => {

            data.forEach((element, i) => {

                let team_id = element["id"];
                this.teacher.getVMs(team_id).subscribe(vms => {
                    data[i]["vms"] = vms;
                })

            });

            this.dataSourceTeams.data = data;
        })
    }

}
