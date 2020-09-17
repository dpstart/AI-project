import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TeacherService } from 'src/app/services/teacher.service';

@Component({
  selector: 'app-create-course',
  templateUrl: './create-course.component.html',
  styleUrls: ['./create-course.component.css']
})
export class CreateCourseComponent implements OnInit {

  isDisabled = true

  form: FormGroup = new FormGroup({
    name: new FormControl('', Validators.required),
    acronime: new FormControl('', Validators.required),
    min: new FormControl('', Validators.required),
    max: new FormControl('', Validators.required),
  });

  message: string | null;
  alertType: string;



  constructor(private teacherService: TeacherService, public dialogRef: MatDialogRef<CreateCourseComponent>
  ) { }

  ngOnInit(): void {
  }

  close(data) { this.dialogRef.close(data); }

  submit() {

    if (this.form.valid) {

      this.teacherService.createCourse(this.form.value).subscribe(res => {
        this.close({ message: "Course Successfully Created", type: "success" });
      },
        error => {
          this.message = error.message
          this.alertType = "danger"
          this.closeAlertAfterTime(3000)
        });
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
