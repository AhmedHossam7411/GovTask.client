import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TasksContainer } from './tasks-container';

describe('TasksContainer', () => {
  let component: TasksContainer;
  let fixture: ComponentFixture<TasksContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TasksContainer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TasksContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
