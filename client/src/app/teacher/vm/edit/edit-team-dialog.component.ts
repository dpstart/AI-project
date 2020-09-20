import { Inject, Component, Input } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormControl, Validators } from '@angular/forms';
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
    ram: new FormControl(this.data.team.ram, Validators.required),
    n_cpu: new FormControl(this.data.team.n_cpu, Validators.required),
    disk_space: new FormControl(this.data.team.disk_space, Validators.required),
    max_active: new FormControl(this.data.team.max_active, Validators.required),
    max_available: new FormControl(this.data.team.max_available, Validators.required)
  });

  message: string | null;
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

    if (this.form.valid) {
      this.teacherService.changeTeamSettings(this.course, this.team.id, this.form.value).subscribe(
        (team) => this.close("Team settings updated successfully.", "success"),
        (error) => {
          this.message = error.message
          this.alertType = "danger"
          this.closeAlertAfterTime(3000)
        }
      )
    }
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
