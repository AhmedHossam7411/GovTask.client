import { Component, EventEmitter, Inject, inject, Input, Output, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartmentDto } from '../departmentDto.model';
import { DepartmentService } from '../../services/department-Service';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

@Component({
  selector: 'app-edit-form',
  imports: [ReactiveFormsModule],
  templateUrl: './edit-form.html',
  styleUrl: './edit-form.css'
})
export class EditForm {
@Input() department: DepartmentDto = { id: 0, name: '' }; 
private departmentService = inject(DepartmentService);

form = new FormGroup({
   name : new FormControl(this.department.name,{
      validators: [Validators.required,Validators.minLength(6) ],
    }),
});

updateDepartment(id: number , departmentDto:DepartmentDto)
  {
    if (this.form.valid && this.department) {
      console.log(this.department.name);
    const updated: DepartmentDto = {
      id: this.department.id,
      name: this.form.value.name ?? this.department.name
         
    };
    console.log("logger",this.department.name,this.department.id);
    this.department.name = updated.name;
    this.departmentService.putDepartment(id,departmentDto).subscribe({
      next: (response) => {
        console.log(this.department.name);
        console.log(this.department.name);

          this.closeModal(); 
        },
        error: (err) => console.error(err),
    })
  }
}
  get nameIsInvalid(){
    return this.form.controls.name.invalid 
    && this.form.controls.name.touched
    && this.form.controls.name.dirty;
  }
   private dialogRef = inject(DialogRef, {optional : true});
   protected closeModal()
   {
    this.dialogRef?.close();
   }
}
