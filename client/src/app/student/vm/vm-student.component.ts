import { Component, OnInit, ChangeDetectorRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { RouteStateService } from 'src/app/services/route-state.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { StudentService, VmSettings } from 'src/app/services/student.service';
import { Team } from 'src/app/model/team.model';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { VMComponent } from 'src/app/teacher/vm/vm.component';
import { MatDialog } from '@angular/material/dialog';
import { EditTeamDialogComponent } from 'src/app/teacher/vm/edit/edit-team-dialog.component';
import { CreateDialogComponent } from './create/create-dialog.component';
import { EditVmDialogComponent } from './edit/edit-vm-dialog.component';
import { Image } from 'src/app/model/image.model';
import { Subscription } from 'rxjs';
import { TeacherService } from 'src/app/services/teacher.service';
import { AuthService } from 'src/app/services/auth.service';
import { VmOwnershipComponent } from '../vm-ownership/vm-ownership.component';
import { Student } from 'src/app/model/student.model';
import { DeleteComponent } from './delete/delete.component';

@Component({
  selector: 'app-vm-student',
  templateUrl: './vm-student.component.html',
  styleUrls: ['./vm-student.component.css']
})
export class VmStudentComponent implements OnInit, OnDestroy {

  // Error handling
  message: string | null;
  alertType: string;

  isAllLoaded: boolean

  innerDisplayedColumns: string[]
  displayedColumns: string[]

  selectedCourse: string
  team: Team;
  teamId: number;
  image: string;

  utilization: VmSettings;

  dataSourceVm: MatTableDataSource<Vm>

  courseSub: Subscription;

  // Components
  private paginator: MatPaginator;
  private sort: MatSort;
  @ViewChild("innerTables") innerTables: MatTable<Vm>;

  @ViewChild(MatSort) set matSort(ms: MatSort) {
    this.sort = ms;
    this.setDataSourceAttributes();
  }

  @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
    this.paginator = mp;
    this.setDataSourceAttributes();
  }


  constructor(
    private routeStateService: RouteStateService,
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private studentService: StudentService,
    private change: ChangeDetectorRef,
    private router: Router,
    private teacherService: TeacherService,
    private auth: AuthService) {

    this.isAllLoaded = false
    this.dataSourceVm = new MatTableDataSource<Vm>();
    this.innerDisplayedColumns = ['position', 'n_cpu', 'disk_space', 'ram', 'status', 'id_creator'];

    this.displayedColumns = ['actions', 'position', 'n_cpu', 'disk_space', 'ram', 'status', 'delete', 'id_creator'];

  }

  ngOnInit(): void {
    this.getData()
  }

  ngOnDestroy(): void {
    this.courseSub.unsubscribe()
  }

  getData() {
    // Voglio sempre e solo una sub
    if (this.courseSub) this.courseSub.unsubscribe()
    this.courseSub = this.activatedRoute.params.subscribe(params => {

      this.selectedCourse = params["course_name"]
      if (this.selectedCourse)
        this.routeStateService.updatePathParamState(this.selectedCourse)



      // Get teams for current course, the need to get vms for each team
      this.studentService.getTeamForCourse(this.selectedCourse).subscribe((team: Team) => {


        this.team = team;

        if (team) {
          this.teamId = team.id

          this.teacherService.getResourcesByTeam(this.teamId).subscribe((settings: VmSettings) => this.utilization = settings)

          this.studentService.getVmsForTeam(team.id).subscribe(vms => {




            // Need to get owners for each team and set the position
            for (let i = 0; i < vms.length; i++) vms[i]['position'] = i + 1;



            // Do not make requests if vms array is empty
            if (vms.length == 0) {
              this.dataSourceVm.data = [...vms]
              this.isAllLoaded = true
            }


            this.studentService.getOwnersMultiple(vms.map(v => v.id)).subscribe((owners: Student[][]) => {



              for (let i = 0; i < owners.length; i++) {
                vms[i]['owners'] = owners[i].map(elem => elem.id);
              }


              this.dataSourceVm.data = [...vms]
              this.isAllLoaded = true

            });
          });


        } else {
          this.message = "In order to use a Vm you need to be part of a team"
          this.alertType = "warning"
          this.closeAlertAfterTime(3000)
          this.isAllLoaded = true
        }
      }, (_) => {
        this.router.navigate(['PageNotFound'])
      });
    })
  }

  setDataSourceAttributes() {
    this.dataSourceVm.paginator = this.paginator;
    this.dataSourceVm.sort = this.sort;
  }

  createVm(event) {
    this.message = ""
    this.alertType = ""
    const dialogRef = this.dialog.open(CreateDialogComponent, {
      width: '500px',
      data: {
        course: this.selectedCourse,
        teamId: this.teamId
      }
    });

    dialogRef.afterClosed().subscribe((response) => {
      this.getData();
      this.message = response.message
      this.alertType = response.type
      this.closeAlertAfterTime(3000)
    })
    event.stopPropagation();

  }


  deleteVm(vm: Vm) {

    const dialogRef = this.dialog.open(DeleteComponent, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe(result => {

      if (result) {
        this.message = ""
        this.alertType = ""
        this.studentService.deleteVm(vm).subscribe((_) => {
          this.dataSourceVm.data.splice(this.dataSourceVm.data.indexOf(vm), 1)
          this.dataSourceVm._updateChangeSubscription()
          this.message = "The vm was successfully deleted"
          this.alertType = "success"
          this.closeAlertAfterTime(3000)
          this.getData()
        },
          (error) => {
            this.message = error.message
            this.alertType = "danger"
            this.closeAlertAfterTime(3000)
          })

      }
    })
  }

  openVmImage(vm: Vm) {
    this.message = ""
    this.alertType = ""

    if (vm.status == 1) {
      this.studentService.connectToVm(vm.id).subscribe(image => {
        let objectURL = 'data:image/png;base64,' + image.picByte
        this.image = objectURL;
        let win = window.open()
        win.document.write('<iframe src="' + this.image + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
      })
    } else {
      this.message = "In order to see your Vm you need to run it"
      this.alertType = "warning"
      this.closeAlertAfterTime(3000)
    }
  }

  openShareDialog(vm: Vm) {
    this.message = ""
    this.alertType = ""

    const dialogRef = this.dialog.open(VmOwnershipComponent, {
      width: '500px',
      data: { vm: vm, teamId: this.teamId, courseName: this.selectedCourse }
    });

    dialogRef.afterClosed().subscribe((response) => {
      this.getData();

      if (!response) return
      this.message = response.message;
      this.alertType = response.type;
      this.closeAlertAfterTime(3000)
    })
  }

  openEditDialog(element, event) {
    this.message = ""
    this.alertType = ""
    const dialogRef = this.dialog.open(EditVmDialogComponent, {
      width: '500px',
      data: { vm: element, course: this.selectedCourse }
    });

    dialogRef.afterClosed().subscribe((response) => {
      this.getData();
      this.message = response.message;
      this.alertType = response.type;
      this.closeAlertAfterTime(3000)
    })
    event.stopPropagation();
  }

  isOwner(vm: Vm) {

    if (vm["owners"].includes(this.auth.getId())) return true;
  }


  changeVmStatus(vm: Vm) {
    this.message = ""
    this.alertType = ""
    this.studentService.changeVmStatus(vm).subscribe((success) => {

      let selected = this.dataSourceVm.data.find((element) => element.id === vm.id)

      if (selected.status === 1) {
        this.message = "The Vm was successfully stopped"
        selected.status = 0
      }
      else {
        this.message = "The Vm was successfully started"
        selected.status = 1
      }

      this.dataSourceVm.data = [...this.dataSourceVm.data]

      this.alertType = "success"
      this.closeAlertAfterTime(3000)

    }, error => {
      this.message = error.message
      this.alertType = "danger"
      this.closeAlertAfterTime(3000)

    })
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

  getAuthId() {
    return this.auth.getId();
  }

}





export interface Vm {
  id: number,
  n_cpu: number,
  disk_space: number,
  ram: number,
  status: number
}


