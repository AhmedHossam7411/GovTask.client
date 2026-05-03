import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartmentDto } from '../departmentDto.model';
import { DepartmentService } from '../../services/department-Service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-edit-form',
  imports: [ReactiveFormsModule],
  templateUrl: './edit-form.html',
  styleUrl: './edit-form.css'
})
export class EditForm {
  private departmentService = inject(DepartmentService);
  private dialogRef = inject(MatDialogRef);
  data = inject(MAT_DIALOG_DATA) as DepartmentDto;
  
form = new FormGroup({
   name : new FormControl('',{
      validators: [Validators.required,Validators.minLength(6) ],
    }),
});
 
  updateDepartment(){
    if(this.form.valid)    {
      const updatedDepartment: DepartmentDto = {
        id: this.data.id,
        name: this.form.value.name || this.data.name
  }
      this.departmentService.putDepartment
      (this.data.id,updatedDepartment).subscribe({
        next: () => {
          this.dialogRef.close(updatedDepartment);
        },
        error: (err) => {
          console.error('Failed to update department', err);
        }
      });
    }
  }
  get nameIsInvalid(){
    return this.form.controls.name.invalid 
    && this.form.controls.name.touched
    && this.form.controls.name.dirty;
  }

   protected closeDialog()
   {
    this.dialogRef.close();
   }
}
