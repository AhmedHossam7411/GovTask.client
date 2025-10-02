import { Component, EventEmitter, inject, Input, Output, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartmentDto } from '../departmentDto.model';
import { DepartmentService } from '../../services/department-Service';

@Component({
  selector: 'app-edit-form',
  imports: [ReactiveFormsModule],
  templateUrl: './edit-form.html',
  styleUrl: './edit-form.css'
})
export class EditForm {
@Input() department: DepartmentDto = { id: 0, name: '' }; 
private departmentService = inject(DepartmentService);
@Output() close = new EventEmitter<string>(); 
form = new FormGroup({
   name : new FormControl(this.department.name,{
      validators: [Validators.required,Validators.minLength(6) ],
    }),
});

onClose()
{
  this.close.emit('');
}

updateDepartment(id: number , departmentDto:DepartmentDto)
  {
    if (this.form.valid && this.department) {
      console.log(this.department.name);
    const updated: DepartmentDto = {
      id: this.department.id,
      name: this.form.value.name ?? this.department.name
         
    };
    console.log("logaya",this.department.name,this.department.id);
    this.department.name = updated.name;
    this.departmentService.putDepartment(id,departmentDto).subscribe({
      next: (response) => {
        console.log(this.department.name);
        console.log(this.department.name);

          this.onClose(); 
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

}
