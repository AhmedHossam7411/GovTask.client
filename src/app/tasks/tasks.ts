import { Component, inject, input } from '@angular/core';
import { taskDto } from './taskDto';
import { MatDialog } from '@angular/material/dialog';
import { DeleteConfirmDialog } from '../department-component/delete-confirm-dialog/delete-confirm-dialog';
import { taskService } from '../services/task-service';

@Component({
  selector: 'app-tasks',
  imports: [],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css'
})
export class Tasks {
  task = input.required<taskDto>();
  private taskService = inject(taskService);
  private errorMessage: string = '';
  private dialogRef = inject(MatDialog);
  
//   openEditDialog(department : taskDto)
//  {
   
//    this.dialogRef.open(EditForm,{
//     data : department
//    });
//  }
 openDeleteDialog(task : taskDto)
 {
   this.dialogRef.open(DeleteConfirmDialog,{
    data : task
   });
 } 

}
