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
export class EditForm implements OnInit {
  private departmentService = inject(DepartmentService);
  private dialogRef = inject(MatDialogRef);
  data = inject(MAT_DIALOG_DATA) as DepartmentDto;
  
  ngOnInit() {
    console.log(this.data);
    this.form.controls.name.setValue(this.data.name);
  }

form = new FormGroup({
   name : new FormControl('',{
      validators: [Validators.required,Validators.minLength(6) ],
    }),
});

updateDepartment(id: number , departmentDto:DepartmentDto)
  {
    if (this.form.valid && this.data) {
      console.log(this.data);
    const updated: DepartmentDto = {
      id: this.data.id,
      name: this.form.value.name ?? this.data.name
         
    };
    console.log("logger",this.data.name,this.data.id);
    this.data.name = updated.name;
    this.departmentService.putDepartment(id,departmentDto).subscribe({
      next: (response) => {
        console.log(this.data.name);
        console.log(this.data.name);

          this.closeDialog(); 
          
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

   protected closeDialog()
   {
    this.dialogRef.close();
   }
}
