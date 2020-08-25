import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { RouteStateService } from 'src/app/services/route-state.service';
import { ActivatedRoute } from '@angular/router';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { StudentService } from 'src/app/services/student.service';
import { Team } from 'src/app/model/team.model';
import { error } from 'protractor';

@Component({
  selector: 'app-vm-student',
  templateUrl: './vm-student.component.html',
  styleUrls: ['./vm-student.component.css']
})
export class VmStudentComponent implements OnInit {

  innerDisplayedColumns: string[]
  displayedColumns: string[]

  dataSourceVm: MatTableDataSource<Vm>

  @ViewChild("innerTables") innerTables: MatTable<Vm>;

  constructor(private routeStateService: RouteStateService, private activatedRoute: ActivatedRoute, private studentService: StudentService, private change: ChangeDetectorRef) {

    this.dataSourceVm = new MatTableDataSource();
    this.innerDisplayedColumns = ['id', 'n_cpu', 'disk_space', 'ram', 'status'];

    this.displayedColumns = ['actions', 'id', 'n_cpu', 'disk_space', 'ram', 'status', 'delete'];

  }

  ngOnInit(): void {

    this.activatedRoute.params.subscribe(params => {
      if (params['course_name'])
        this.routeStateService.updatePathParamState(params['course_name'])


      this.studentService.getTeamForCourse(params['course_name']).subscribe((team: Team) => {

        this.studentService.getVmsForTeam(1).subscribe(vms => {
          vms.push({
            id: 1,
            n_cpu: 1,
            disk_space: 2,
            ram: 12,
            status: 1 // TODO ricordare gli stati} )
          })

          this.dataSourceVm.data = [...vms]
        })

      }, (error) => {
        console.log(error)
      });


    })
  }


  deleteVm(vm: Vm) {
    this.studentService.deleteVm(vm).subscribe((_) => {
     this.dataSourceVm.data.splice(this.dataSourceVm.data.indexOf(vm),1)
     this.dataSourceVm._updateChangeSubscription()
    })
  }

  changeVmStatus(vm: Vm) {
    this.studentService.changeVmStatus(vm).subscribe((_) => {

      this.dataSourceVm.data.forEach((selected) => {
        if (selected.id == vm.id) {
          selected.status == 1 ? 0 : 1;
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
