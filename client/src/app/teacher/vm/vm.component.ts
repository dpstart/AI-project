import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { TeacherService } from '../../services/teacher.service';
import { Team } from '../../model/team.model';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { EditTeamDialogComponent } from './edit/edit-team-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { RouteStateService } from 'src/app/services/route-state.service';
import { StudentService, VmSettings } from 'src/app/services/student.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subscription } from 'rxjs';

interface teamResources {
    team_id: string;
    settings: VmSettings
}

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
export class VMComponent implements OnInit, OnDestroy {


    // Currently selected course
    selectedCourse: string

    message: string | null;
    alertType: string;


    // flag to know wheter vms were retrieved. This is used in the template
    // to conditionally show the vm table

    columnsToDisplay: string[] = ['position', 'actions', 'name', 'disk_space', 'ram', 'n_cpu'];
    innerDisplayedColumns = ['position', 'id_creator', 'n_cpu', 'disk_space', 'ram', 'status', 'actions'];
    dataSourceTeams: MatTableDataSource<any> = new MatTableDataSource<any>();
    teamsRunningResources: { [id: string]: VmSettings; } = {}

    private paginator: MatPaginator;
    private sort: MatSort;


    // The team element expanded from the table
    expandedElement: Team | null;

    isAllLoaded: boolean
    image: string

    courseSub: Subscription;

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
        private routerStateService: RouteStateService,
        private studentService: StudentService,
        private router: Router,
    ) {
        this.isAllLoaded = false
    }

    ngOnInit(): void {
        this.getData()
    }

    ngOnDestroy(): void {
        this.courseSub.unsubscribe()
    }

    setDataSourceAttributes() {
        this.dataSourceTeams.paginator = this.paginator;
        this.dataSourceTeams.sort = this.sort;
    }



    // Fill component data structures with relevant data
    getData() {

        // Voglio sempre e solo una sub
        if (this.courseSub) this.courseSub.unsubscribe()

        this.courseSub = this.activatedRoute.params.subscribe((params) => {

            if (params['course_name']) {

                this.selectedCourse = params['course_name'];

                this.routerStateService.updatePathParamState(this.selectedCourse)


                this.teacherService.getTeams(this.selectedCourse).subscribe((data: Team[]) => {


                    // For every team, the resources and vms
                    data.forEach((team, i) => {
                        team['position'] = i + 1

                        let team_id = team["id"];

                        this.teacherService.getResourcesByTeam(team_id).subscribe((settings: VmSettings) => {

                            this.teamsRunningResources[team_id] = settings;
                        })

                        this.teacherService.getVmsForTeam(team_id).subscribe(vms => {

                            data[i]["vms"] = vms;

                            for (let i = 0; i < vms.length; i++) {
                                vms[i]['position'] = i + 1
                            }

                        })
                    });
                    this.dataSourceTeams.data = data;
                    this.isAllLoaded = true
                }, (_) => this.router.navigate(['PageNotFound']))
            }
        })
    }

    openEditDialog(element, event) {

        const dialogRef = this.dialog.open(EditTeamDialogComponent, {
            width: '500px',
            data: { team: element, course: this.selectedCourse }
        });

        dialogRef.afterClosed().subscribe((result) => {
            this.getData();

            if (result === undefined)
                return
            this.message = result.message || null;
            this.alertType = result.type;
            this.closeAlertAfterTime(3000)
        })
        event.stopPropagation();
    }

    openVmImage(element, event) {

        this.studentService.connectToVm(element.id).subscribe(image => {

            let objectURL = 'data:image/png;base64,' + image.picByte
            this.image = objectURL;
            let win = window.open()
            win.document.write('<iframe src="' + this.image + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
        }, error => {
            this.alertType = "danger"
            this.message = error.message
            this.closeAlertAfterTime(3000)
        })
        event.stopPropagation();
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
