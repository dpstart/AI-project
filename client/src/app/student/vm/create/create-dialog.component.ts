import { Component, OnInit, Inject, Input } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup } from '@angular/forms';
import { StudentService } from 'src/app/services/student.service';
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
    ram: new FormControl(''),
    n_cpu: new FormControl(''),
    disk_space: new FormControl(''),
    max_active: new FormControl(''),
    max_available: new FormControl(''),
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

  close() { this.dialogRef.close(); }

  submit() {

    const formData = new FormData();
    formData.append('image', this.selectedFile, this.selectedFile.name);
    formData.append('settings', this.form.value)



    if (this.selectedFile)
      this.studentService.createVM(this.data.course, this.data.teamId, formData).subscribe(res => res);
  }



  //Gets called when the user selects an image
  public onFileChanged(event) {
    //Select File
    this.selectedFile = event.target.files[0];
    this.fileName = this.selectedFile.name
  }


}
