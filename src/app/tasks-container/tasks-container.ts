import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Tasks } from '../tasks/tasks';
import { MatDialog } from '@angular/material/dialog';
import { taskDto } from '../tasks/taskDto';
import { taskService } from '../services/task-service';

@Component({
  selector: 'app-tasks-container',
  imports: [Tasks],
  templateUrl: './tasks-container.html',
  styleUrl: './tasks-container.css'
})
export class TasksContainer {
  protected tasks: taskDto[] = [];
  private taskService = inject(taskService);
  private errorMessage:string = '';
  private dialogRef = inject(MatDialog);
  #cdr = inject(ChangeDetectorRef)
  
  ngOnInit() {
    this.loadtasks();
  }
  loadtasks() {
    this.taskService.getTasks().subscribe({
      next: (data) => {
        this.tasks = data
        this.#cdr.markForCheck()
      },
      error: (err) => this.errorMessage = 'failed to fetch Tasks' + err
    });
  }

}
