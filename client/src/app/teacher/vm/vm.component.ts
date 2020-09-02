import { Component, OnInit, Inject, ViewChild, AfterViewInit } from '@angular/core';
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
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';



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

    private paginator: MatPaginator;
    private sort: MatSort;


    expandedElement: Team | null;

    isAllLoaded: boolean

    @ViewChild(MatSort) set matSort(ms: MatSort) {
        this.sort = ms;
        this.setDataSourceAttributes();
    }

    @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
        this.paginator = mp;
        this.setDataSourceAttributes();
    }


    constructor(
        private teacherService: TeacherService,
        private activatedRoute: ActivatedRoute,
        private dialog: MatDialog,
        private routerStateService: RouteStateService) {
        this.isAllLoaded = false
    }


    setDataSourceAttributes() {
        this.dataSourceTeams.paginator = this.paginator;
        this.dataSourceTeams.sort = this.sort;
    }



    getData() {

        this.activatedRoute.params.subscribe((params) => {

            let current_course = params['course_name']
            if (current_course) {
                this.selectedCourse = params['course_name'];

                this.routerStateService.updatePathParamState(current_course)


                this.teacherService.getTeams(current_course).subscribe((data: Team[]) => {

                    data.forEach((element, i) => {
                        let team_id = element["id"];

                        this.teacherService.getVmsForTeam(team_id).subscribe(vms => {
                            data[i]["vms"] = vms;
                        })
                    });

                    this.dataSourceTeams.data = data;
                    this.isAllLoaded = true
                })
            }
        })
    }

    openEditDialog(element, event) {

        const dialogRef = this.dialog.open(EditTeamDialogComponent, {
            width: '500px',
            data: { team: element, course: this.selectedCourse }
        });

        dialogRef.afterClosed().subscribe(() => this.getData())
        event.stopPropagation();
    }

    ngOnInit() {

        this.getData()
    }




}
