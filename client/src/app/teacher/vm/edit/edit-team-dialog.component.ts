import { Inject, Component, Input } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'edit-team-dialog',
  templateUrl: './edit-team-dialog.component.html',
  styleUrls: ['./edit-team-dialog.component.css']
})
export class EditTeamDialogComponent {


  form: FormGroup = new FormGroup({
    ram: new FormControl(this.data.team.ram),
    n_cpu: new FormControl(''),
    disk_space: new FormControl(''),
  });

  @Input() error: string | null;


  constructor(
    public dialogRef: MatDialogRef<EditTeamDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data) {

  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  close() { }
  submit() { }
}
