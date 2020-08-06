import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentNotInTeamComponent } from './student-not-in-team.component';

describe('StudentNotInTeamComponent', () => {
  let component: StudentNotInTeamComponent;
  let fixture: ComponentFixture<StudentNotInTeamComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StudentNotInTeamComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StudentNotInTeamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
