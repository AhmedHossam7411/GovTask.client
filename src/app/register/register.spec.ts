import { ComponentFixture, TestBed } from '@angular/core/testing';

import { register } from './register';

describe('Register', () => {
  let component: register;
  let fixture: ComponentFixture<register>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [register]
    })
    .compileComponents();

    fixture = TestBed.createComponent(register);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
