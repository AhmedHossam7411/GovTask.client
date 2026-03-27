import { Component, inject, input } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DocumentService } from '../../../services/document-service';
import { documentDto } from '../../documentDto';

@Component({
  selector: 'app-add-document-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './add-document-dialog.html',
  styleUrl: './add-document-dialog.css'
})
export class AddDocumentDialog {
  Document = input.required<documentDto>();
  private DocumentService = inject(DocumentService);
  private dialogRef = inject(MatDialogRef);
  #fb = inject(NonNullableFormBuilder);

  form = this.#fb.group({
    name: this.#fb.control('', {
      validators: [Validators.required, Validators.minLength(6)],
    }),
      description: this.#fb.control('', {
      validators: [Validators.required, Validators.minLength(15)],
    }),
      uploadDate: this.#fb.control('', {
      validators: [Validators.required, Validators.minLength(6),Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)],
      }),  
      taskId: this.#fb.control('',{
      validators: [Validators.required, Validators.pattern('^[0-9]*$')],
      })
  });

  addDocument(DocumentDto: any) {
    console.log(DocumentDto);
    this.DocumentService.postDocument(DocumentDto).subscribe({
      next: (created) => {
        this.dialogRef.close(created);
      },
      error: (err) => console.error(err),
    });
  }

  get nameIsInvalid() {
    return (
      this.form.controls.name.invalid &&
      this.form.controls.name.touched &&
      this.form.controls.name.dirty
    );
  }
    get descriptionIsInvalid() {
    return (
      this.form.controls.description.invalid &&
      this.form.controls.description.touched &&
      this.form.controls.description.dirty
    );
  }
   get uploadDateIsInvalid() {
  return (
    this.form.controls.uploadDate.invalid &&
    this.form.controls.uploadDate.touched &&
    this.form.controls.uploadDate.dirty
  );
}
   closeDocumentDialog() {
    this.dialogRef.close();
  }
}
