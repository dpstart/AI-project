import { Component, OnInit, Inject } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { TeacherService } from '../../services/teacher.service';
import { Team } from '../../model/team.model';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { EditTeamDialogComponent } from './edit/edit-team-dialog.component';
import { ActivatedRoute } from '@angular/router';
import { RouteStateService } from 'src/app/services/route-state.service';
import { StudentService } from 'src/app/services/student.service';
import { Student } from 'src/app/model/student.model';



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

    selectedCourse: string

    columnsToDisplay: string[] = ['actions', 'name', 'id', 'disk_space', 'ram'];
    innerDisplayedColumns = ['id', 'n_cpu', 'disk_space', 'ram', 'status'];
    dataSourceTeams: MatTableDataSource<any> = new MatTableDataSource<any>();

    expandedElement: Team | null;



    constructor(private studentService: StudentService, private activatedRoute: ActivatedRoute, private dialog: MatDialog, private routerStateService: RouteStateService) { }

    openEditDialog(element, event) {

        const dialogRef = this.dialog.open(EditTeamDialogComponent, {
            width: '500px',
            data: { team: element }
        });
        event.stopPropagation();
    }

    ngOnInit() {


        this.activatedRoute.params.subscribe((params) => {

            if (params['course_name']) {
                this.selectedCourse = params['course_name'];

                this.routerStateService.updatePathParamState(params['course_name'])


                this.studentService.getTeamsOfStudent().subscribe((data: Team[]) => {

                    data.forEach((element, i) => {
                        let team_id = element["id"];

                        this.studentService.getVmsForTeam(team_id).subscribe(vms => {
                            data[i]["vms"] = vms;
                        })
                    });

                    this.dataSourceTeams.data = data;
                })
            }
        })
    }
}
