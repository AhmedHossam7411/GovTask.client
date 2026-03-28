import { Component, inject, input, OnInit, Output, EventEmitter } from '@angular/core';
import { taskDto } from './taskDto';
import { MatDialog } from '@angular/material/dialog';
import { DeleteTaskDialog } from './delete-task-dialog/delete-task-dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ViewDetailsDialog } from '../shared/view-details-dialog/view-details-dialog';
import { TaskEditDialog } from './task-edit-dialog/task-edit-dialog';

@Component({
  selector: 'app-tasks',
  imports: [MatSlideToggleModule],
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

  openDeleteDialog(task: taskDto) {
    console.log('Opening delete dialog for task:', task);
    const dialogRef = this.dialogRef.open(DeleteTaskDialog, {
      data: task
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res === 'confirm') {
        this.itemDeleted.emit(task.id);
      }
    });
  }

  openViewDialog(task: taskDto) {
    this.dialogRef.open(ViewDetailsDialog, {
      data: { entity: task, type: 'Task' },
      panelClass: 'custom-dialog-container'
    });
  }

  openEditDialog(task: taskDto) {
    const dialogRef = this.dialogRef.open(TaskEditDialog, {
      data: task
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.itemEdited.emit(res);
      }
    });
  }
}
