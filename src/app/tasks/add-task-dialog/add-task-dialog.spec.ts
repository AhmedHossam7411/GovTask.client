import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTaskDialog } from './add-task-dialog';

describe('AddTaskDialog', () => {
  let component: AddTaskDialog;
  let fixture: ComponentFixture<AddTaskDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddTaskDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddTaskDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
