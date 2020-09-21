import { Inject, Component, Input } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { TeacherService } from 'src/app/services/teacher.service';
import { Team } from 'src/app/model/team.model';
import { VmSettings, StudentService } from 'src/app/services/student.service';


@Component({
  selector: 'delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.css']
})
export class DeleteComponent {


  constructor(
    public dialogRef: MatDialogRef<DeleteComponent>) {

  }


  close(res) { this.dialogRef.close(res); }
  submit() {


  }

}
