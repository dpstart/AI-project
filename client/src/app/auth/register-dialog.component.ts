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

  constructor(private dialogRef: MatDialogRef<RegisterDialogComponent>, private auth: AuthService) { }

  form: FormGroup = new FormGroup({
    firstName: new FormControl('', Validators.required),
    name: new FormControl('', Validators.required),
    id: new FormControl('', Validators.required),
    email: new FormControl('', Validators.pattern('^(s|d){0,1}[0-9]{6}((@studenti.polito.it)|(@polito.it))$')),
    password: new FormControl('', Validators.required),
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
