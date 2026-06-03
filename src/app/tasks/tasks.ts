import { Component, inject, input, OnInit, Output, EventEmitter } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { taskDto } from './taskDto';
import { MatDialog } from '@angular/material/dialog';
import { DeleteTaskDialog } from './delete-task-dialog/delete-task-dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TaskEditDialog } from './task-edit-dialog/task-edit-dialog';

@Component({
  selector: 'app-tasks',
  imports: [MatSlideToggleModule, DatePipe],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css'
})
export class Tasks implements OnInit {

  task = input.required<taskDto>();
  private dialogRef = inject(MatDialog);
  private router = inject(Router);

  @Output() itemEdited = new EventEmitter<taskDto>();
  @Output() itemDeleted = new EventEmitter<number>();

  ngOnInit(): void {
    console.log('Tasks component initialized with task:', this.task());
  }

  /** Whole days from today until the task's due date (negative = overdue). */
  daysUntilDue(): number | null {
    const d = this.task().dueDate;
    if (!d) return null;
    const due = new Date(d).getTime();
    if (isNaN(due)) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.ceil((due - today.getTime()) / 86_400_000);
  }

  dueLabel(): string {
    const n = this.daysUntilDue();
    if (n === null) return 'No due date';
    if (n < 0) return `Overdue by ${Math.abs(n)}d`;
    if (n === 0) return 'Due today';
    if (n === 1) return 'Due tomorrow';
    return `Due in ${n} days`;
  }

  dueClass(): string {
    const n = this.daysUntilDue();
    if (n === null) return 'bg-cream-200 text-stone2-600 border-ink-900/10';
    if (n < 0)  return 'bg-red-50 text-red-700 border-red-200';
    if (n <= 2) return 'bg-bronze-300/30 text-bronze-700 border-bronze-300';
    return 'bg-sage-100 text-sage-700 border-sage-200';
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
    this.router.navigate(['/view', 'task', task.id], { state: { entity: task } });
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
