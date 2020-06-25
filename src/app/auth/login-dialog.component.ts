import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { MatDialogRef } from '@angular/material/dialog';


@Component({
  selector: 'app-login-dialog',
  templateUrl: './login-dialog.component.html',
  styles: [`
  :host {
    display: flex;
    justify-content: center;
    margin: 100px 0px;
  }

  .mat-form-field {
    width: 100%;
    min-width: 300px;
  }

  mat-card-title,
  mat-card-content {
    display: flex;
    justify-content: center;
  }

  .error {
    padding: 16px;
    width: 300px;
    color: white;
    background-color: red;
  }

  .cancel{
    margin-left:10px;
  }
`]
})
export class LoginDialogComponent {

  constructor(private dialogRef: MatDialogRef<LoginDialogComponent>, private auth: AuthService) { }

  form: FormGroup = new FormGroup({
    username: new FormControl(''),
    password: new FormControl(''),
  });

  submit() {
    if (this.form.valid) {
      this.save();
    }
  }
  @Input() error: string | null;

  save() {
    this.auth.login(this.form.value.username, this.form.value.password).subscribe(data => {

      var sess = {};

      sess["email"] = this.form.value.username;
      sess["info"] = JSON.parse(atob(data["accessToken"].split('.')[1]));
      sess["token"] = data["accessToken"]

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
