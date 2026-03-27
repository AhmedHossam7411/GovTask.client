import { ChangeDetectorRef, Component, inject, OnInit, signal, computed } from '@angular/core';
import { Tasks } from '../tasks/tasks';
import { MatDialog } from '@angular/material/dialog';
import { taskDto } from '../tasks/taskDto';
import { taskService } from '../services/task-service';
import { AddTaskDialog } from '../tasks/add-task-dialog/add-task-dialog';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'app-tasks-container',
  imports: [Tasks],
  templateUrl: './tasks-container.html',
  styleUrl: './tasks-container.css'
})
export class TasksContainer implements OnInit {
  protected tasks = signal<taskDto[]>([]);
  public searchTerm = signal('');
  
  protected filteredTasks = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.tasks();
    return this.tasks().filter(t => 
      t.name.toLowerCase().includes(term) || 
      (t.description && t.description.toLowerCase().includes(term)) ||
      t.id.toString().includes(term)
    );
  });
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
        this.tasks.set(data);
        this.#cdr.markForCheck();
      },
      error: (err) => this.errorMessage = 'failed to fetch Tasks' + err
    });
  }
  openAddDialog() {
     const dialogRef = this.dialogRef.open(AddTaskDialog);
     dialogRef.afterClosed().subscribe((newTask : taskDto) => {
      if(newTask)
      {
        this.tasks.update(ts => [...ts, newTask]);
        this.#cdr.markForCheck();
      }
     });
   }

  onTaskEdited(updatedTask: taskDto) {
    this.tasks.update(ts => ts.map(t => 
      t.id === updatedTask.id ? updatedTask : t
    ));
    this.#cdr.markForCheck();
  }

  onTaskDeleted(deletedId: number) {
    this.tasks.update(ts => ts.filter(t => t.id !== deletedId));
    this.#cdr.markForCheck();
  }
}
