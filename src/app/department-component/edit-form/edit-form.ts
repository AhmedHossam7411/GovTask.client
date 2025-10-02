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
   name : new FormControl('',{
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
      console.log(this.department,this.department.id);
    const updated: DepartmentDto = {
      ...this.department,
      name: this.form.value.name || ''
      
    };
    console.log(this.department,this.department.id);
    this.departmentService.putDepartment(id,departmentDto).subscribe({
      next: (response) => {
        console.log(this.department,this.department.id);
          this.department.name = response.name;
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
