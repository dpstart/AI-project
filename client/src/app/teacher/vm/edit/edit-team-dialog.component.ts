import { Inject, Component, Input } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormControl } from '@angular/forms';
import { TeacherService } from 'src/app/services/teacher.service';
import { Team } from 'src/app/model/team.model';

@Component({
  selector: 'edit-team-dialog',
  templateUrl: './edit-team-dialog.component.html',
  styleUrls: ['./edit-team-dialog.component.css']
})
export class EditTeamDialogComponent {

  team: Team
  course: string

  form: FormGroup = new FormGroup({
    ram: new FormControl(this.data.team.ram),
    n_cpu: new FormControl(this.data.team.n_cpu),
    disk_space: new FormControl(this.data.team.disk_space),
    max_active: new FormControl(this.data.team.max_active || "--"),
    max_available: new FormControl(this.data.team.max_available || "--")
  });

  @Input() error: string | null;
  alertType: string;


  constructor(
    public dialogRef: MatDialogRef<EditTeamDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data,
    private teacherService: TeacherService) {

    this.team = data.team;
    this.course = data.course;

  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  close(message: string, type: string) { this.dialogRef.close({ message: message, type: type }); }
  submit() {
    this.teacherService.changeTeamSettings(this.course, this.team.id, this.form.value).subscribe(
      (team) => this.close("Team settings updated successfully.", "success"),
      (error) => { this.error = error.message; this.alertType = "danger"; }
    )
  }
}
