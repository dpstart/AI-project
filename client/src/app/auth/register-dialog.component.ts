import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService, RegisteredUser } from '../services/auth.service';

@Component({
  selector: 'app-register-dialog',
  templateUrl: './register-dialog.component.html',
  styleUrls: ['./shared.styles.css']
})
export class RegisterDialogComponent implements OnInit {

  message: string | null;

  alertType: string

  //hide password
  hide = true

  selectedFile: File;


  constructor(private dialogRef: MatDialogRef<RegisterDialogComponent>, private auth: AuthService) {
    this.message = ""
    this.alertType = ""
  }

  form: FormGroup = new FormGroup({
    firstName: new FormControl('', Validators.required),
    name: new FormControl('', Validators.required),
    fileName: new FormControl('', Validators.required),
    id: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.pattern('^(s|d){0,1}[0-9]{6}((@studenti.polito.it)|(@polito.it))$')]),
    password: new FormControl('', Validators.required),
  });


  ngOnInit(): void {
  }

  submit() {
    if (this.form.valid) {

      let user: RegisteredUser = this.form.value;
      this.auth.register(user, this.selectedFile)
        .subscribe(
          data => {
            console.log(data)
            this.alertType = "success"
            this.message = "An email was sent to your account, please click on the link to confirm."
          },
          error => {
            this.alertType = "danger"
            this.message = error.message
          })
    }
  }


  close() {
    this.dialogRef.close();

  }



  //Gets called when the user selects an image
  onFileChanged(event) {
    //Select File
    this.selectedFile = event.target.files[0]

    this.form.get('fileName').setValue(this.selectedFile.name)
  }


}
