import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoveCourseDialogComponent } from './remove-course-dialog.component';

describe('RemoveCourseDialogComponent', () => {
  let component: RemoveCourseDialogComponent;
  let fixture: ComponentFixture<RemoveCourseDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RemoveCourseDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RemoveCourseDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
