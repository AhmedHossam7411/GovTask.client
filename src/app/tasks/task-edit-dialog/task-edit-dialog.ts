import { Component, inject, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { taskService } from '../../services/task-service';
import { taskDto } from '../taskDto';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-task-edit-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-edit-dialog.html',
  styleUrl: './task-edit-dialog.css'
})
export class TaskEditDialog implements OnInit {
  private taskService = inject(taskService);
  private dialogRef = inject(MatDialogRef);
  data = inject(MAT_DIALOG_DATA) as taskDto;

  form = new FormGroup({
    name: new FormControl('', {
      validators: [Validators.required, Validators.minLength(6)],
    }),
    description: new FormControl('', {
      validators: [Validators.required, Validators.minLength(15)],
    }),
    dueDate: new FormControl('', {
      validators: [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)],
    }),
    departmentId: new FormControl(0, {
      validators: [Validators.required]
    })
  });

  ngOnInit() {
    this.form.patchValue({
      name: this.data.name,
      description: this.data.description,
      dueDate: this.data.dueDate,
      departmentId: this.data.departmentId
    });
  }

  updateTask() {
    if (this.form.valid) {
      const updatedTask: taskDto = {
        ...this.data,
        name: this.form.value.name!,
        description: this.form.value.description!,
        dueDate: this.form.value.dueDate!,
        departmentId: this.form.value.departmentId!
      };

      this.taskService.putTask(updatedTask).subscribe({
        next: () => {
          this.dialogRef.close(updatedTask);
        },
        error: (err) => {
          console.error('Failed to update task', err);
        }
      });
    }
  }

  get nameIsInvalid() {
    return this.form.controls.name.invalid && this.form.controls.name.touched;
  }

  get descriptionIsInvalid() {
    return this.form.controls.description.invalid && this.form.controls.description.touched;
  }

  get dueDateIsInvalid() {
    return this.form.controls.dueDate.invalid && this.form.controls.dueDate.touched;
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
