import { Component, inject, input, OnInit, Output, EventEmitter } from '@angular/core';
import { taskDto } from './taskDto';
import { MatDialog } from '@angular/material/dialog';
import { DeleteTaskDialog } from './delete-task-dialog/delete-task-dialog';
import { DatePipe } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-tasks',
  imports: [DatePipe, MatSlideToggleModule],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css'
})
export class Tasks implements OnInit {

  task = input.required<taskDto>();
  private dialogRef = inject(MatDialog);

  @Output() itemEdited = new EventEmitter<taskDto>();
  @Output() itemDeleted = new EventEmitter<number>();

    ngOnInit(): void {
    console.log('Tasks component initialized with task:', this.task());
  }

//   openEditDialog(department : taskDto)
//  {
   
//    this.dialogRef.open(EditForm,{
//     data : department
//    });
//  }
 openDeleteDialog(task : taskDto)
 {
   console.log('Opening delete dialog for task:', task);
   const dialogRef = this.dialogRef.open(DeleteTaskDialog,{
    data : task
   });
   dialogRef.afterClosed().subscribe(res => {
     if (res === 'confirm') {
       this.itemDeleted.emit(task.id);
     }
   });
 } 

}
