import { Inject, Component, Input } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { TeacherService } from 'src/app/services/teacher.service';
import { Team } from 'src/app/model/team.model';
import { VmSettings, StudentService } from 'src/app/services/student.service';


@Component({
  selector: 'edit-vm-dialog',
  templateUrl: './edit-vm-dialog.component.html',
  styleUrls: ['./edit-vm-dialog.component.css']
})
export class EditVmDialogComponent {

  vmId: number
  course: string

  isDisabled = true

  form: FormGroup = new FormGroup({
    ram: new FormControl(this.data.vm.ram, Validators.required),
    n_cpu: new FormControl(this.data.vm.n_cpu, Validators.required),
    disk_space: new FormControl(this.data.vm.disk_space, Validators.required),
    imageName: new FormControl('', Validators.required),
  });

  @Input() message: string | null;
  alertType: string;

  selectedFile: File;
  fileName: string


  constructor(
    public dialogRef: MatDialogRef<EditVmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data,
    private studentService: StudentService) {

    this.vmId = data.vm.id;

  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  close() { this.dialogRef.close(); }
  submit() {

    if (this.form.valid) {
      const formData = new FormData();

      let settings: VmSettings = {
        ram: this.form.value.ram, n_cpu: this.form.value.n_cpu, disk_space: this.form.value.disk_space,
        max_active: 0, max_available: 0
      }

      formData.append('image', this.selectedFile, this.selectedFile.name);
      formData.append('settings', new Blob([JSON.stringify(settings)], {
        type: "application/json"
      }))

      this.studentService.editVM(this.vmId, formData).subscribe(success => {

        this.message = "The Vm was successfully updated."
        this.alertType = "success"
      }, error => {
        this.message = error.message
        this.alertType = "danger"
      });
    }
  }

  //Gets called when the user selects an image
  public onFileChanged(event) {
    //Select File
    this.selectedFile = event.target.files[0];
    this.form.get("imageName").setValue(this.selectedFile.name)
  }
}
