import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDocumentDialog } from './add-document-dialog';

describe('AddDocumentDialog', () => {
  let component: AddDocumentDialog;
  let fixture: ComponentFixture<AddDocumentDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddDocumentDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddDocumentDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
