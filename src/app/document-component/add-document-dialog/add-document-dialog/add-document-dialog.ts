import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DocumentService } from '../../../services/document-service';
import { DocumentVaultService } from '../../../services/document-vault.service';
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
  private vault = inject(DocumentVaultService);
  private dialogRef = inject(MatDialogRef);
  #fb = inject(NonNullableFormBuilder);

  // Picked file (held until the document is created, then saved to the vault)
  protected pickedFile = signal<{ fileName: string; fileType: string; size: number; dataUrl: string; status: string } | null>(null);
  protected fileError = signal('');
  protected dragging = signal(false);

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

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) await this.ingest(file);
  }

  async onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) await this.ingest(file);
  }

  private async ingest(file: File) {
    this.fileError.set('');
    try {
      const entry = await this.vault.readFile(file);
      this.pickedFile.set(entry);
      // Auto-fill the name from the file (without extension) if still empty.
      if (!this.form.controls.name.value) {
        const base = file.name.replace(/\.[^.]+$/, '');
        this.form.controls.name.setValue(base.length >= 6 ? base : (base + ' document'));
      }
      if (!this.form.controls.uploadDate.value) {
        this.form.controls.uploadDate.setValue(new Date().toISOString().slice(0, 10));
      }
    } catch (e: any) {
      this.fileError.set(e?.message ?? 'Could not read file');
    }
  }

  removeFile() {
    this.pickedFile.set(null);
    this.fileError.set('');
  }

  prettySize(bytes?: number): string {
    if (!bytes) return '';
    return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  addDocument(DocumentDto: any) {
    this.DocumentService.postDocument(DocumentDto).subscribe({
      next: (created) => {
        // Persist the real file + initial tracking status against the new document id.
        const f = this.pickedFile();
        if (f && created?.id != null) {
          this.vault.save(created.id, f);
        }
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
