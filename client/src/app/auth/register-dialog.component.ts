import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../services/auth.service';

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
    this.auth.register(this.form.value.first_name, this.form.value.last_name,
      this.form.value.id, this.form.value.email, this.form.value.password)
      .subscribe(data => { console.log(data) })
  }

  close() {
    this.dialogRef.close();

  }

}
