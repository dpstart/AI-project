import { Component, OnInit, ChangeDetectorRef, ViewChild, AfterViewInit } from '@angular/core';
import { RouteStateService } from 'src/app/services/route-state.service';
import { ActivatedRoute } from '@angular/router';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { StudentService } from 'src/app/services/student.service';
import { Team } from 'src/app/model/team.model';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { VMComponent } from 'src/app/teacher/vm/vm.component';
import { MatDialog } from '@angular/material/dialog';
import { EditTeamDialogComponent } from 'src/app/teacher/vm/edit/edit-team-dialog.component';
import { CreateDialogComponent } from './create/create-dialog.component';
import { EditVmDialogComponent } from './edit/edit-vm-dialog.component';
import { Image } from 'src/app/model/image.model';

@Component({
  selector: 'app-vm-student',
  templateUrl: './vm-student.component.html',
  styleUrls: ['./vm-student.component.css']
})
export class VmStudentComponent implements OnInit {

  message: string | null;
  alertType: string;

  innerDisplayedColumns: string[]
  displayedColumns: string[]

  selectedCourse: string

  dataSourceVm: MatTableDataSource<Vm>

  private paginator: MatPaginator;
  private sort: MatSort;

  isAllLoaded: boolean

  @ViewChild("innerTables") innerTables: MatTable<Vm>;

  @ViewChild(MatSort) set matSort(ms: MatSort) {
    this.sort = ms;
    this.setDataSourceAttributes();
  }

  @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
    this.paginator = mp;
    this.setDataSourceAttributes();
  }


  teamId: number;
  image: string;

  constructor(
    private routeStateService: RouteStateService,
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private studentService: StudentService,
    private change: ChangeDetectorRef) {

    this.isAllLoaded = false
    this.dataSourceVm = new MatTableDataSource<Vm>();
    this.innerDisplayedColumns = ['id', 'n_cpu', 'disk_space', 'ram', 'status'];

    this.displayedColumns = ['actions', 'id', 'n_cpu', 'disk_space', 'ram', 'status', 'delete'];

  }


  ngOnInit(): void {
    this.getData()
  }

  getData() {
    this.activatedRoute.params.subscribe(params => {
      if (params['course_name'])
        this.routeStateService.updatePathParamState(params['course_name'])

      this.selectedCourse = params["course_name"]

      this.studentService.getTeamForCourse(params['course_name']).subscribe((team: Team) => {


        this.teamId = team.id


        this.studentService.getVmsForTeam(team.id).subscribe(vms => {

          this.dataSourceVm.data = [...vms]
          this.isAllLoaded = true
        })

      }, (error) => {
        this.isAllLoaded = true
      });

    })
  }

  setDataSourceAttributes() {
    this.dataSourceVm.paginator = this.paginator;
    this.dataSourceVm.sort = this.sort;
  }

  createVm() {

    const dialogRef = this.dialog.open(CreateDialogComponent, {
      width: '500px',
      data: {
        course: this.selectedCourse,
        teamId: this.teamId
      }
    });

    dialogRef.afterClosed().subscribe((response) => {
      this.getData();
      this.message = response.message;
      this.alertType = response.type;

    })
    event.stopPropagation();

  }


  deleteVm(vm: Vm) {
    this.studentService.deleteVm(vm).subscribe((_) => {
      this.dataSourceVm.data.splice(this.dataSourceVm.data.indexOf(vm), 1)
      this.dataSourceVm._updateChangeSubscription()
    },
      (error) => { this.message = error.message; this.alertType = "danger"; })
  }

  openVmImage(vm: Vm) {

    this.studentService.connectToVm(vm.id).subscribe(image => {


      let objectURL = 'data:image/png;base64,' + image.picByte
      this.image = objectURL;
      let win = window.open()
      win.document.write('<iframe src="' + this.image + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
    })

  }

  openEditDialog(element, event) {


    const dialogRef = this.dialog.open(EditVmDialogComponent, {
      width: '500px',
      data: { vm: element, course: this.selectedCourse }
    });

    dialogRef.afterClosed().subscribe(() => this.getData())
    event.stopPropagation();
  }


  changeVmStatus(vm: Vm) {
    this.studentService.changeVmStatus(vm).subscribe((_) => {

      this.dataSourceVm.data.forEach((selected) => {
        if (selected.id === vm.id) {
          selected.status === 1 ? selected.status = 0 : selected.status = 1;
        }
      })

      this.dataSourceVm.data = [...this.dataSourceVm.data]
    })
  }

}

export interface Vm {
  id: number,
  n_cpu: number,
  disk_space: number,
  ram: number,
  status: number // TODO ricordare gli stati
}


