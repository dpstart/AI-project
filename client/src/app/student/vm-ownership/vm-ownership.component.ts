import { Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { every } from 'rxjs/operators';
import { Student } from 'src/app/model/student.model';
import { AuthService } from 'src/app/services/auth.service';
import { StudentService } from 'src/app/services/student.service';
import { Vm } from '../vm/vm-student.component';

@Component({
  selector: 'app-vm-ownership',
  templateUrl: './vm-ownership.component.html',
  styleUrls: ['./vm-ownership.component.css']
})
export class VmOwnershipComponent implements OnInit {

  message: string | null;
  alertType: string;

  form: FormGroup;

  courseName: string;
  teamId: number
  vm: Vm

  studentsInTeam: Student[]
  owners: string[]

  constructor(
    @Inject(MAT_DIALOG_DATA) public data,
    public dialogRef: MatDialogRef<VmOwnershipComponent>,
    private studentService: StudentService,
    private auth: AuthService,
    private fb: FormBuilder

  ) {

    this.courseName = data.courseName
    this.teamId = data.teamId
    this.vm = data.vm

    this.form = this.fb.group({
      checkArray: this.fb.array([], [Validators.required])
    })
  }

  ngOnInit(): void {
    this.initData()

  }

  initData() {

    this.studentService.getTeamMembers(this.courseName, this.teamId).subscribe(

      (res: Student[]) => {
        this.studentsInTeam = res.filter(s => s.id != this.auth.getId());

        this.studentService.getOwners(this.vm.id).subscribe(
          (res: Student[]) => { this.owners = res.map(elem => elem.id); },
          error => { })
      },
      error => { })

  }

  onCheckboxChange(e) {

    const checkArray: FormArray = this.form.get('checkArray') as FormArray;

    if (e.checked) {
      checkArray.push(new FormControl(e.source.value));

    } else {
      let i: number = 0;
      checkArray.controls.forEach((item: FormControl) => {
        if (item.value == e.source.value) {
          checkArray.removeAt(i);
          return;
        }
        i++;
      });
    }
  }

  close(data) { this.dialogRef.close(data); }
  submit() {

    if (this.form.valid) {
      this.studentService.shareOwnership(this.vm.id, this.form.value["checkArray"]).subscribe(
        res => {

          this.close({ message: "Ownership successfully shared", type: "success" })
        },
        error => {
          this.alertType = "danger"
          this.message = error.message;
        });

    }
  }

  isOwner(student: Student) {

    if (this.owners === undefined) return false;

    return this.owners.includes(student.id)
  }

  isEveryoneOwner() {


    let everyone = true;
    if (this.owners === undefined) return false;

    this.studentsInTeam.forEach(s => {

      if (!this.owners.includes(s.id)) everyone = false;

    });

    return everyone;
  }
}
