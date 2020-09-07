import { Component, OnInit, Inject, Input } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup } from '@angular/forms';
import { StudentService } from 'src/app/services/student.service';
import { Team } from 'src/app/model/team.model';

@Component({
  selector: 'app-create-dialog',
  templateUrl: './create-dialog.component.html',
  styleUrls: ['./create-dialog.component.css']
})
export class CreateDialogComponent implements OnInit {

  form: FormGroup = new FormGroup({
    ram: new FormControl(''),
    n_cpu: new FormControl(''),
    disk_space: new FormControl(''),
    max_active: new FormControl(''),
    max_available: new FormControl(''),
  });

  @Input() message: string | null;
  alertType: string;

  teamId: number;

  constructor(@Inject(MAT_DIALOG_DATA) public data, public dialogRef: MatDialogRef<CreateDialogComponent>, private student: StudentService) { }

  ngOnInit(): void {

    this.student.getTeamForCourse(this.data.course).subscribe((team: Team) => this.teamId = team.id);

  }

  close() { this.dialogRef.close(); }

  submit() {
    this.student.createVM(this.data.course, this.teamId, this.form.value).subscribe(res => res);
  }

}
