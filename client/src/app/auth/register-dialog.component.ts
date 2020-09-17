import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService, RegisteredUserForm } from '../services/auth.service';


export const passwordValidator: ValidatorFn = (
  control: FormGroup
): ValidationErrors | null => {
  const password = control.get("password").value;
  const confirmPassword = control.get("confirmPassword").value;
  return password && confirmPassword && password === confirmPassword
    ? null
    : { passwordsNotEqual: true };
};


@Component({
  selector: 'app-register-dialog',
  templateUrl: './register-dialog.component.html',
  styleUrls: ['./shared.styles.css']
})
export class RegisterDialogComponent implements OnInit {

  message: string | null;
  alertType: string

  //hide password flag
  hide = true

  selectedFile: File;
  pattern: string = "s******@studenti.polito.it"

  form: FormGroup;


  constructor(private dialogRef: MatDialogRef<RegisterDialogComponent>, private auth: AuthService) {
    this.message = ""
    this.alertType = ""

    this.form = new FormGroup({
      firstName: new FormControl('', Validators.required),
      name: new FormControl('', Validators.required),
      fileName: new FormControl(''),
      id: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{6}$')]),
      email: new FormControl(
        this.pattern,
        [
          Validators.required,
          Validators.pattern('^(s|d){0,1}[0-9]{6}((@studenti.polito.it)|(@polito.it))$')
        ]),
      password: new FormControl('', [Validators.required,Validators.minLength(8),Validators.maxLength(12)]),
      confirmPassword: new FormControl('')
    }, { validators: passwordValidator }
    );
  }

  ngOnInit(): void {

    this.form.get('id').valueChanges.subscribe(data => {
      this.combinePatternId()
    })
  }

  submit() {
    if (this.form.valid) {

      let user: RegisteredUserForm = this.form.value;
      this.auth.register(user, this.selectedFile)
        .subscribe(
          data => {
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



  combinePatternId() {
    let id = this.form.get("id").value
    console.log(id);

    if (id.length > 0 && id.length <= 6) {
      this.form.get('email').setValue(this.pattern.charAt(0) + id + this.pattern.substring(1 + id.length))
    } else
      this.form.get('email').setValue(this.pattern)

  }

  onPatternChanged(event) {
    this.pattern = event
    this.combinePatternId()
  }


}
