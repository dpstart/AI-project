import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeworkStudentComponent } from './homework-student.component';

describe('HomeworkStudentComponent', () => {
  let component: HomeworkStudentComponent;
  let fixture: ComponentFixture<HomeworkStudentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HomeworkStudentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeworkStudentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
