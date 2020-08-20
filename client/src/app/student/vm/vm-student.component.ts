import { Component, OnInit } from '@angular/core';
import { RouteStateService } from 'src/app/services/route-state.service';
import { ActivatedRoute } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
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

  constructor(private routeStateService: RouteStateService, private activatedRoute: ActivatedRoute, private studentService: StudentService) {

    this.innerDisplayedColumns = ['id', 'n_cpu', 'disk_space', 'ram', 'status'];

    this.displayedColumns = ['actions', 'id', 'n_cpu', 'disk_space', 'ram', 'status', 'delete'];

  }

  ngOnInit(): void {

    this.activatedRoute.params.subscribe(params => {
      if (params['course_name'])
        this.routeStateService.updatePathParamState(params['course_name'])


      this.studentService.getTeamForCourse(params['course_name']).subscribe((team: Team) => {

        this.studentService.getVmsForTeam(team.id).subscribe(vms=>{
          this.dataSourceVm.data = [...vms]
        })

      },(error)=>{
        console.log(error)
      });


    })
  }


  deleteVm(vm: Vm) {
    this.studentService.deleteVm(vm)
  }

  changeVmStatus(vm: Vm) {
    this.studentService.changeVmStatus(vm)
  }

}

export interface Vm {
  id: number,
  n_cpu: number,
  disk_space: number,
  ram: number,
  status: number // TODO ricordare gli stati
}
