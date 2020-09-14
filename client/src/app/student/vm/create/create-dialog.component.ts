import { Component, OnInit, Inject, Input } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { StudentService, VmSettings } from 'src/app/services/student.service';
import { Team } from 'src/app/model/team.model';
import { AuthService } from 'src/app/services/auth.service';
import { TeacherService } from 'src/app/services/teacher.service';

@Component({
  selector: 'app-create-dialog',
  templateUrl: './create-dialog.component.html',
  styleUrls: ['./create-dialog.component.css']
})
export class CreateDialogComponent implements OnInit {

  isDisabled = true

  form: FormGroup = new FormGroup({
    ram: new FormControl('', Validators.required),
    n_cpu: new FormControl('', Validators.required),
    disk_space: new FormControl('', Validators.required),
    max_active: new FormControl('', Validators.required),
    max_available: new FormControl('', Validators.required),
    imageName: new FormControl('', Validators.required),
  });

  @Input() message: string | null;
  alertType: string;

  selectedFile: File;
  fileName: string


  constructor(
    @Inject(MAT_DIALOG_DATA) public data,
    public dialogRef: MatDialogRef<CreateDialogComponent>,
    private studentService: StudentService,
  ) {
  }

  ngOnInit(): void {
  }

  close(data) { this.dialogRef.close(data); }

  submit() {

    const formData = new FormData();

    let settings: VmSettings = {
      ram: this.form.value.ram, n_cpu: this.form.value.n_cpu, disk_space: this.form.value.disk_space,
      max_active: this.form.value.max_active, max_available: this.form.value.max_available
    }

    formData.append('image', this.selectedFile, this.fileName);
    formData.append('settings', new Blob([JSON.stringify(settings)], {
      type: "application/json"
    }))

    if (this.selectedFile)
      this.studentService.createVM(this.data.course, this.data.teamId, formData).subscribe(res => {
        this.close({ message: "VM Successfully Created", type: "success" });
      },
        error => { this.message = error.message; this.alertType = "danger"; });
  }



  //Gets called when the user selects an image
  public onFileChanged(event) {
    //Select File
    this.selectedFile = event.target.files[0];
    this.form.get("imageName").setValue(this.selectedFile.name)
  }


}
