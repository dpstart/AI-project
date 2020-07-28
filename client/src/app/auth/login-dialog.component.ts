import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { MatDialogRef } from '@angular/material/dialog';


@Component({
  selector: 'app-login-dialog',
  templateUrl: './login-dialog.component.html',
  styleUrls: ['./shared.styles.css']
})
export class LoginDialogComponent {

  constructor(private dialogRef: MatDialogRef<LoginDialogComponent>, private auth: AuthService) { }

  form: FormGroup = new FormGroup({
    email: new FormControl(''),
    password: new FormControl(''),
  });

  submit() {
    if (this.form.valid) {
      this.save();
    }
  }
  @Input() error: string | null;

  save() {
    this.auth.login(this.form.value.email, this.form.value.password).subscribe(data => {

      var sess = {};

      sess["email"] = this.form.value.email;
      sess["info"] = JSON.parse(atob(data["token"].split('.')[1]));
      sess["token"] = data["token"]

      localStorage.setItem("session", JSON.stringify(sess));
      

      this.dialogRef.close();

    }, error => {
      this.error = error.error;
    })

  }

  close() {
    this.dialogRef.close();

  }

}
