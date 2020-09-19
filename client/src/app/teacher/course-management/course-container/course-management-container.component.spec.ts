import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseManagementContainerComponent } from './course-management-container.component';

describe('CourseManagementContainerComponent', () => {
  let component: CourseManagementContainerComponent;
  let fixture: ComponentFixture<CourseManagementContainerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CourseManagementContainerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CourseManagementContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
