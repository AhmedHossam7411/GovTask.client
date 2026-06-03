import { DatePipe } from '@angular/common';
import { Component, inject, input, OnInit, Output, EventEmitter, signal } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { documentDto } from './documentDto';
import { MatDialog } from '@angular/material/dialog';
import { DeleteDocumentDialog } from './delete-document-dialog/delete-document-dialog/delete-document-dialog';
import { DocumentEditDialog } from './document-edit-dialog/document-edit-dialog';
import { DocumentVaultService, VaultEntry } from '../services/document-vault.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-documents',
  imports: [DatePipe, MatSlideToggleModule],
  templateUrl: './documents.html',
  styleUrl: './documents.css'
})
export class Documents implements OnInit{

  document = input.required<documentDto>();
  private dialogRef = inject(MatDialog);
  private vault = inject(DocumentVaultService);
  private router = inject(Router);

  @Output() itemEdited = new EventEmitter<documentDto>();
  @Output() itemDeleted = new EventEmitter<number>();

  
  protected fileInfo = signal<VaultEntry | null>(null);
  protected status = signal<string>('On file');

    ngOnInit(): void {
    const entry = this.vault.get(this.document().id);
    this.fileInfo.set(entry);
    this.status.set(entry?.status ?? 'On file');
  }

  advanceStatus(): void {
    this.status.set(this.vault.advanceStatus(this.document().id));
  }

  download(): void {
    const f = this.fileInfo();
    if (!f?.dataUrl) return;
    const a = window.document.createElement('a');
    a.href = f.dataUrl;
    a.download = f.fileName ?? 'document';
    a.click();
  }

  prettySize(bytes?: number): string {
    if (!bytes) return '';
    return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  statusClass(): string {
    switch (this.status()) {
      case 'Uploaded':  return 'bg-sage-100 text-sage-700 border-sage-200';
      case 'In Review': return 'bg-bronze-300/30 text-bronze-700 border-bronze-300';
      case 'Approved':  return 'bg-sage-600 text-cream-50 border-sage-700';
      case 'Archived':  return 'bg-stone2-400/20 text-stone2-600 border-stone2-400/40';
      default:          return 'bg-cream-200 text-stone2-600 border-ink-900/10';
    }
  }

 openDeleteDialog(document : documentDto)
  {
   console.log('Opening delete dialog for document:', document);
   const dialogRef = this.dialogRef.open(DeleteDocumentDialog,{
    data : document
   });
   dialogRef.afterClosed().subscribe(res => {
     if (res === 'confirm') {
       this.itemDeleted.emit(document.id);
     }
    });
   } 

   openViewDialog(document: documentDto) {
    this.router.navigate(['/view', 'document', document.id], { state: { entity: document } });
  }

  openEditDialog(document: documentDto) {
    const dialogRef = this.dialogRef.open(DocumentEditDialog, {
      data: document
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.itemEdited.emit(res);
      }
    });
  }
}
