import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login-dialog',
  templateUrl: './login-dialog.component.html',
  styleUrls: ['./shared.styles.css']
})
export class LoginDialogComponent {

  hide = true;

  constructor(private dialogRef: MatDialogRef<LoginDialogComponent>, private authService: AuthService, private router: Router) {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['home'])
      this.close()
    }
  }

  form: FormGroup = new FormGroup({
    email: new FormControl('',
      [Validators.required,
      Validators.pattern("(^[0-9]{6}$)|(^d[0-9]{6}@polito\.it$)|(^s[0-9]{6}@studenti\.polito\.it$)|(^[a-z]+\.[a-z]+$)|(^[a-z]+\.[a-z]+@polito\.it$)|(^[a-z]+\.[a-z]+@studenti\.polito\.it$)")
      ]),
    password: new FormControl('', Validators.required),
  });

  submit() {
    if (this.form.valid) {
      this.save();
    }
  }
  @Input() error: string | null;

  save() {
    this.authService.login(this.form.value.email, this.form.value.password).subscribe(
      data => {

        var sess = {};

        sess["info"] = JSON.parse(atob(data["token"].split('.')[1]));
        sess["token"] = data["token"]

        localStorage.setItem("session", JSON.stringify(sess));



        this.authService.getSelf().subscribe((data) => {

          if (data.email)
            sess["email"] = data.email;
          if (data.alias)
            sess["alias"] = data.alias;
          if (data.firstName)
            sess["firstName"] = data.firstName;
          if (data.name)
            sess["name"] = data.name;
          if (data.id)
            sess["id"] = data.id;

          this.authService.profileCard.next({
            id: sess['id'],
            firstName: sess['firstName'],
            name: sess['name'],
            email: sess['email'],
            alias: sess['alias'],
          })

          localStorage.setItem("session", JSON.stringify(sess));
        })


        this.authService.getImage().subscribe(success => {

          sess["image"] = success


          this.authService.profileImage.next(sess['image'])

          localStorage.setItem("session", JSON.stringify(sess));

          
        })

        this.close()

      }, error => {
        this.error = error.message;
      })

  }

  close() {
    this.dialogRef.close();
    this.router.navigate(['home'])
  }

}
