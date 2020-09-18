import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StudentService } from 'src/app/services/student.service';

@Component({
  selector: 'app-activate-account',
  templateUrl: './activate-account.component.html',
  styleUrls: ['./activate-account.component.css']
})
export class ActivateAccountComponent implements OnInit {
  
  
  constructor(
    private activatedRoute: ActivatedRoute,
    private studentService: StudentService) {

  }

  ngOnInit(): void {

    this.activatedRoute.params.subscribe(params => {
      let token = params['token']
      if (token)
        this.studentService.confirmAccount(token).subscribe(
          _ => {
            console.log("account confirmed");
          }
          , _ => {
            console.log("account not confirmed");
          }
        )
    })
  }


}
