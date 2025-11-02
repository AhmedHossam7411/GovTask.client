import { Component, inject, input} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { taskService } from '../../services/task-service';
import { taskDto } from '../taskDto';
import{
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
  NonNullableFormBuilder,
} from '@angular/forms';

@Component({
  selector: 'app-add-task-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './add-task-dialog.html',
  styleUrl: './add-task-dialog.css',
})
export class AddTaskDialog {
  task = input.required<taskDto>();
  private taskService = inject(taskService);
  private dialogRef = inject(MatDialogRef);
  #fb = inject(NonNullableFormBuilder);

  form = this.#fb.group({
    name: this.#fb.control('', {
      validators: [Validators.required, Validators.minLength(6)],
    }),
      description: this.#fb.control('', {
      validators: [Validators.required, Validators.minLength(15)],
    }),
      dueDate: this.#fb.control('', {
      validators: [Validators.required, Validators.minLength(6),Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)],
      }),  
      departmentId: null as number | null
  });

  addtask(taskDto: any) {
    console.log(taskDto);
    this.taskService.postTask(taskDto).subscribe({
      next: () => {
        this.closeTaskDialog();
      },
      error: (err) => console.error(err),
    });
  }

  get nameIsInvalid() {
    return (
      this.form.controls.name.invalid &&
      this.form.controls.name.touched &&
      this.form.controls.name.dirty
    );
  }
    get descriptionIsInvalid() {
    return (
      this.form.controls.description.invalid &&
      this.form.controls.description.touched &&
      this.form.controls.description.dirty
    );
  }
   closeTaskDialog() {
    this.dialogRef.close();
  }
}
