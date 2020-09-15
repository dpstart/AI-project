import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { MatDialogRef } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-login-dialog',
  templateUrl: './login-dialog.component.html',
  styleUrls: ['./shared.styles.css']
})
export class LoginDialogComponent {

  // Flag usato per nascondere password
  hide = true;

  constructor(
    private dialogRef: MatDialogRef<LoginDialogComponent>,
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute) {
    //Controllo utile solo se copi e incolli url del login nella url, allora si viene rediretti alla home
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['home'])
      this.close()
    }
  }

  // Form relativo al login
  form: FormGroup = new FormGroup({
    email: new FormControl('',
      [Validators.required,
      // Pattern email accettabile è:
      // s<matricola>@studenti.polito.it
      // alias <==> nome.cognome@studenti.polito.it
      // d<matricola>@polito.it
      // alias <==> nome.cognome@polito.it
      // <matricola>
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
    // Effettuo login 
    this.authService.login(this.form.value.email, this.form.value.password).subscribe(
      data => {
        var sess = {};


        // Setto token ricevuto
        sess["info"] = JSON.parse(atob(data["token"].split('.')[1]));
        sess["token"] = data["token"]


        localStorage.setItem("session", JSON.stringify(sess));

        // Ritiro informazioni relative allo user
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
          // Scrittura idempotente, perchè salvo lo stesso oggetto di prima ma aggiungo anche altri campi
          localStorage.setItem("session", JSON.stringify(sess));
        })


        //Ritiro immagine
        this.authService.getImage().subscribe(image => {

          // Se mi ritorni un immagine nulla allora niente
          if (image.picByte == null && image.type == null)
            return;
          //Setto immagine
          sess["image"] = image
          // Avviso che c'è una immagine
          this.authService.profileImage.next(sess['image'])

          // Salvo nella sessione, anche qui scrittura idempotente
          localStorage.setItem("session", JSON.stringify(sess));
        })

        // Chiudo il dialog, intanto però sto ritirando informazioni
        this.close()
      }, error => {

        // Messaggio di errore in caso di sbaglio nelle credenziali
        if (error.status === 401)
          this.error = "Wrong credentials"
        else this.error = error.message;
      })

  }

  close() {
    this.dialogRef.close();
    // Se è presente un redirect, settato nell'authGuard sia dello studente che del teacher, 
    // allora eseguo il redirect altrimenti vado alla home
    let redirect = this.activatedRoute.snapshot.queryParams['redirect']

    if (!redirect) redirect = "home"
    this.router.navigate([redirect])
  }

}
