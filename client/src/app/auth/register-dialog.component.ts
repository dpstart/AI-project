import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-register-dialog',
  templateUrl: './register-dialog.component.html',
  styleUrls: ['./shared.styles.css']
})
export class RegisterDialogComponent implements OnInit {

  constructor(private dialogRef: MatDialogRef<RegisterDialogComponent>) { }

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
  }

  close() {
    this.dialogRef.close();

  }

}
