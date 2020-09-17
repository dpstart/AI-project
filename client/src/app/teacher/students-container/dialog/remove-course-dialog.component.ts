import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-remove-course-dialog',
  templateUrl: './remove-course-dialog.component.html',
  styleUrls: ['./remove-course-dialog.component.css']
})
export class RemoveCourseDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<RemoveCourseDialogComponent>,
    
    @Inject(MAT_DIALOG_DATA) public data: string) { 

    }

  ngOnInit(): void {
  }

  onCancel(): void {
    this.dialogRef.close();
  }

}
