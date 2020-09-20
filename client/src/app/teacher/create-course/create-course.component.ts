import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TeacherService, VmModel } from 'src/app/services/teacher.service';

@Component({
  selector: 'app-create-course',
  templateUrl: './create-course.component.html',
  styleUrls: ['./create-course.component.css']
})
export class CreateCourseComponent implements OnInit {

  // Flag che permette di disabilitare bottone di confirm
  isDisabled = true

  // Form di aggunta corso
  form: FormGroup = new FormGroup({
    name: new FormControl(''),
    acronime: new FormControl(''),
    min: new FormControl(''),
    max: new FormControl(''),
    vmmodel: new FormControl('')
  });


  // Alert 
  message: string | null;
  alertType: string;



  constructor(
    private teacherService: TeacherService,
    public dialogRef: MatDialogRef<CreateCourseComponent>
  ) { }

  ngOnInit(): void {

  }

  close(data) { this.dialogRef.close(data); }

  submit() {

    //se form è valido
    if (this.form.valid) {

      // creo corso
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
