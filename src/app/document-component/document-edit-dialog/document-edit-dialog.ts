import { Component, inject, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DocumentService } from '../../services/document-service';
import { documentDto } from '../documentDto';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-document-edit-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './document-edit-dialog.html',
  styleUrl: './document-edit-dialog.css'
})
export class DocumentEditDialog implements OnInit {
  private documentService = inject(DocumentService);
  private dialogRef = inject(MatDialogRef);
  data = inject(MAT_DIALOG_DATA) as documentDto;

  form = new FormGroup({
    name: new FormControl('', {
      validators: [Validators.required, Validators.minLength(6)],
    }),
    description: new FormControl('', {
      validators: [Validators.required, Validators.minLength(15)],
    }),
    uploadDate: new FormControl('', {
      validators: [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)],
    }),
    taskId: new FormControl(0, {
      validators: [Validators.required]
    })
  });

  ngOnInit() {
    this.form.patchValue({
      name: this.data.name,
      description: this.data.description,
      uploadDate: this.data.uploadDate,
      taskId: this.data.taskId
    });
  }

  updateDocument() {
    if (this.form.valid) {
      const updatedDoc: documentDto = {
        ...this.data,
        name: this.form.value.name!,
        description: this.form.value.description!,
        uploadDate: this.form.value.uploadDate!,
        taskId: this.form.value.taskId!
      };

      this.documentService.putDocument(this.data.id, updatedDoc).subscribe({
        next: () => {
          this.dialogRef.close(updatedDoc);
        },
        error: (err) => {
          console.error('Failed to update document', err);
        }
      });
    }
  }

  get nameIsInvalid() {
    return this.form.controls.name.invalid && this.form.controls.name.touched;
  }
  
  get descriptionIsInvalid() {
    return this.form.controls.description.invalid && this.form.controls.description.touched;
  }

  get uploadDateIsInvalid() {
    return this.form.controls.uploadDate.invalid && this.form.controls.uploadDate.touched;
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
