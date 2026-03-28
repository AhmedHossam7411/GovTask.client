import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-view-details-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './view-details-dialog.html',
  styleUrl: './view-details-dialog.css'
})
export class ViewDetailsDialog {
  constructor(
    public dialogRef: MatDialogRef<ViewDetailsDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { entity: any, type: 'Department' | 'Task' | 'Document' }
  ) {}

  get title(): string {
    return this.data.entity.name || 'Details';
  }

  get icon(): string {
    switch (this.data.type) {
      case 'Department': return 'building';
      case 'Task': return 'clipboard-list';
      case 'Document': return 'file-text';
      default: return 'info-circle';
    }
  }

  get colorClass(): string {
    switch (this.data.type) {
      case 'Department': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
      case 'Task': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Document': return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  }
}
