import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepartmentContainerComponent } from './department-container-component';

describe('DepartmentContainerComponent', () => {
  let component: DepartmentContainerComponent;
  let fixture: ComponentFixture<DepartmentContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepartmentContainerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DepartmentContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
