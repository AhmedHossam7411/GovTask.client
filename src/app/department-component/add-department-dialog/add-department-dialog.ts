import { Component, inject, input} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { DepartmentService } from '../../services/department-Service';
import { DepartmentDto } from '../departmentDto.model';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
  NonNullableFormBuilder,
} from '@angular/forms';

@Component({
  selector: 'app-add-department-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './add-department-dialog.html',
  styleUrl: './add-department-dialog.css',
})
export class AddDepartmentDialog {
  department = input.required<DepartmentDto>();
  private departmentService = inject(DepartmentService);
  private dialogRef = inject(MatDialogRef);
  #fb = inject(NonNullableFormBuilder);

  form = this.#fb.group({
    name: this.#fb.control('', {
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  addDepartment(departmentDto: any) {
    console.log(departmentDto);
    this.departmentService.postDepartment(departmentDto).subscribe({
      next: (response) => {
        this.closeDialog(response);
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

  protected closeDialog(departmentDto: DepartmentDto) {
    this.dialogRef.close();
  }
}
