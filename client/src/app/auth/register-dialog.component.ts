import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, ValidationErrors } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService, RegisteredUserForm } from '../services/auth.service';

/**
 * Custom validator per check password e confirm password se uguali
 * @param control 
 */
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

  // Messaggio per UX
  message: string | null;
  alertType: string

  //hide password flag
  hide = true

  // Immagine utente in registrazione
  selectedFile: File;

  // Inizializzazione pattern
  pattern: string = "s******@studenti.polito.it"

  // Form di registrazione
  form: FormGroup;

  // Flag che permette di dire se la registrazione è in corso
  isRegistrationSubmitting: boolean

  constructor(
    private dialogRef: MatDialogRef<RegisterDialogComponent>,
    private authService: AuthService,
    private router: Router) {

    //Controllo utile solo se copi e incolli url della register nella url, allora si viene rediretti alla home
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['home'])
      this.close()
    }

    this.message = ""
    this.alertType = ""
    this.isRegistrationSubmitting = false

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
      password: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(12)]),
      confirmPassword: new FormControl('')
    }, { validators: passwordValidator });

  }

  ngOnInit(): void {
    // Sottoscrivo a cambiamenti della matricola, perché devo genero automaticamente la mail
    this.form.get('id').valueChanges.subscribe(_ => {
      this.combinePatternId()
    })
  }

  submit() {
    if (this.form.valid) {
      // Creo copia del form
      let user: RegisteredUserForm = { ...this.form.value };

      // Aggiorno flag 
      this.isRegistrationSubmitting = true

      // Effettuo chiamata per registrazione utente
      this.authService.register(user, this.selectedFile)
        .subscribe(
          data => {
            // La registrazione è finita aggiorno flag
            this.isRegistrationSubmitting = false
            // In caso di successo disabilito il form
            // Questo perchè mostro messaggio di successo e chiudo il form
            this.form.disable()
            // Setto messaggio 
            this.alertType = "success"
            this.message = "An email was sent to your account, please click on the link to confirm."
            setTimeout(() => this.close(), 3000)
          },
          error => {
            this.isRegistrationSubmitting = false
            this.alertType = "danger"
            this.message = error.message
            setTimeout(() => {
              this.message = ""
              this.alertType = ""
            }, 3000)
          })
    }
  }
  /**
   * Metodo che serve a chiudere dialog di registrazione
   */
  close() {
    this.dialogRef.close();
  }



  //Gets called when the user selects an image
  onFileChanged(event) {
    //Select File
    this.selectedFile = event.target.files[0]

    this.form.get('fileName').setValue(this.selectedFile.name)
  }


  /**
   * Metodo che permette di ricreare automaticamente la mail dato l'id
   */
  combinePatternId() {
    let id = this.form.get("id").value
    console.log(id);

    if (id.length > 0 && id.length <= 6) {
      this.form.get('email').setValue(this.pattern.charAt(0) + id + this.pattern.substring(1 + id.length))
    } else
      this.form.get('email').setValue(this.pattern)
  }

  /**
   * Metodo che permette di rendersi conto quando il pattern è cambiato. 
   * Questo avviene in base al ruolo settato, se studente o professore.
   * @param event 
   */
  onPatternChanged(event) {
    this.pattern = event
    // Aggiorno la mail di conseguenza
    this.combinePatternId()
  }


}
