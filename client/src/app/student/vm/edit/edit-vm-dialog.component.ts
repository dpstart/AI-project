import { Inject, Component, Input } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormControl } from '@angular/forms';
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
    ram: new FormControl(this.data.vm.ram),
    n_cpu: new FormControl(this.data.vm.n_cpu),
    disk_space: new FormControl(this.data.vm.disk_space),
    max_active: new FormControl(this.data.vm.max_active || "--"),
    max_available: new FormControl(this.data.vm.max_available || "--"),
    image: new FormControl(''),
    imageName: new FormControl(''),
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

    const formData = new FormData();

    let settings: VmSettings = {
      ram: this.form.value.ram, n_cpu: this.form.value.n_cpu, disk_space: this.form.value.disk_space,
      max_active: this.form.value.max_active, max_available: this.form.value.max_available
    }

    console.log("settings", settings)

    formData.append('image', this.selectedFile, this.selectedFile.name);
    formData.append('settings', new Blob([JSON.stringify(settings)], {
      type: "application/json"
    }))

    this.studentService.editVM(this.vmId, formData);
  }

  //Gets called when the user selects an image
  public onFileChanged(event) {
    //Select File
    this.selectedFile = event.target.files[0];
  }
}
