import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StudentService } from 'src/app/services/student.service';

@Component({
  selector: 'app-reject-token',
  templateUrl: './reject-token.component.html',
  styleUrls: ['./reject-token.component.css']
})
export class RejectTokenComponent implements OnInit {

  constructor(
    private activatedRoute: ActivatedRoute,
    private studentService: StudentService) {

  }

  ngOnInit(): void {

    this.activatedRoute.params.subscribe(params => {
      let token = params['token']
      if (token)
        this.studentService.actionToken(token, true).subscribe(
          _ => {
            console.log("Token confirmed");
          }
          , _ => {
            console.log("Token not confirmed");
          }
        )
    })
  }
}
