import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VmStudentComponent } from './vm-student.component';

describe('VmStudentComponent', () => {
  let component: VmStudentComponent;
  let fixture: ComponentFixture<VmStudentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VmStudentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VmStudentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
