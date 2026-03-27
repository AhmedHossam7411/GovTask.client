import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { DocumentService } from '../../../services/document-service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { documentDto } from '../../documentDto';
import { taskService } from '../../../services/task-service';

@Component({
  selector: 'app-delete-document-dialog',
  imports: [],
  templateUrl: './delete-document-dialog.html',
  styleUrl: './delete-document-dialog.css'
})
export class DeleteDocumentDialog implements OnInit {
  private DocumentService = inject(DocumentService);
  private taskService = inject(taskService);
  private dialogRef = inject(MatDialogRef);
  private cdr = inject(ChangeDetectorRef);
  data = inject(MAT_DIALOG_DATA) as documentDto;

  associatedTaskName: string | null = null;
  isLoadingTask = false;

  ngOnInit() {
    if (this.data.taskId && this.data.taskId !== 0) {
      this.isLoadingTask = true;
      this.taskService.getTasks().subscribe({
        next: (tasks) => {
          if (tasks && Array.isArray(tasks)) {
            // Use loose comparison in case data.taskId is a string
            const matchingTask = tasks.find(t => t.id == this.data.taskId);
            this.associatedTaskName = matchingTask ? matchingTask.name : 'Unknown Task';
          } else {
            this.associatedTaskName = 'Unknown Task';
          }
          this.isLoadingTask = false;
          this.cdr.detectChanges(); // Force UI update
        },
        error: (err) => {
          console.error('Failed to fetch tasks', err);
          this.associatedTaskName = 'Unknown Task';
          this.isLoadingTask = false;
          this.cdr.detectChanges(); // Force UI update
        }
      });
    }
  }

  confirmDocumentDelete()
  {
      this.DocumentService.deleteDocument(this.data.id)
      .subscribe({
        next : () => {
          this.dialogRef.close('confirm');
        },
        error: (err) => {
          console.log(err);
          this.dialogRef.close('error');
        }
      });
  }
  
   closeDocumentDialog()
   {
    this.dialogRef.close();
   }
}
