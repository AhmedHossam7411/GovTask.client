import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { taskService } from '../../services/task-service';
import { taskDto } from '../taskDto';

@Component({
  selector: 'app-delete-task-dialog',
  imports: [],
  templateUrl: './delete-task-dialog.html',
  styleUrl: './delete-task-dialog.css'
})
export class DeleteTaskDialog {
   private taskService = inject(taskService);
  private dialogRef = inject(MatDialogRef);
  data = inject(MAT_DIALOG_DATA) as taskDto;

  confirmTaskDelete()
  {
      this.taskService.deleteTask(this.data.id)
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
   closeTaskDialog()
   {
    this.dialogRef.close();
   }
}
