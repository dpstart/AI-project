import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { StudentService } from 'src/app/services/student.service';

@Component({
  selector: 'app-activate-account',
  templateUrl: './activate-account.component.html',
  styleUrls: ['./activate-account.component.css']
})
export class ActivateAccountComponent implements OnInit, OnDestroy {


  courseSub: Subscription

  constructor(
    private activatedRoute: ActivatedRoute,
    private studentService: StudentService) {

  }

  ngOnInit(): void {

    this.courseSub = this.activatedRoute.params.subscribe(params => {
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

  ngOnDestroy(): void {
    this.courseSub.unsubscribe()
  }



}
