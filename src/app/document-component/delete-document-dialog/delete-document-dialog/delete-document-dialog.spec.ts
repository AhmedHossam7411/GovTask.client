import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteDocumentDialog } from './delete-document-dialog';

describe('DeleteDocumentDialog', () => {
  let component: DeleteDocumentDialog;
  let fixture: ComponentFixture<DeleteDocumentDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteDocumentDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteDocumentDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
