import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeworkContainerComponent } from './homework-container.component';

describe('HomeworkContainerComponent', () => {
  let component: HomeworkContainerComponent;
  let fixture: ComponentFixture<HomeworkContainerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HomeworkContainerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeworkContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
