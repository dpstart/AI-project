import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService, RegisteredUser } from '../services/auth.service';

@Component({
  selector: 'app-register-dialog',
  templateUrl: './register-dialog.component.html',
  styleUrls: ['./shared.styles.css']
})
export class RegisterDialogComponent implements OnInit {

  constructor(private dialogRef: MatDialogRef<RegisterDialogComponent>, private auth: AuthService) { }

  form: FormGroup = new FormGroup({
    first_name: new FormControl(''),
    last_name: new FormControl(''),
    id: new FormControl(''),
    email: new FormControl(''),
    password: new FormControl(''),
  });

  @Input() error: string | null;

  ngOnInit(): void {
  }

  submit() {
    if (this.form.valid) {
      this.save();
    }
  }

  save() {

    let user: RegisteredUser = this.form.value;
    this.auth.register(user)
      .subscribe(
        data => { console.log(data) },
        error => this.error = error.message)
  }

  close() {
    this.dialogRef.close();

  }

}
