import { Component, inject, Input } from '@angular/core';
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
@Input() department!: DepartmentDto; 
private departmentService = inject(DepartmentService);

form = new FormGroup({
   name : new FormControl('',{
      validators: [Validators.required, ],
    }),
});


updateDepartment(id: string , departmentDto:DepartmentDto)
  {
    this.departmentService.putDepartment(id,departmentDto).subscribe({
      next: () => {
          
        },
        error: (err) => console.error(err),
    })
  }

}
