import { Component, inject, Input } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DepartmentService } from '../../services/department-Service';
import { DepartmentDto } from '../departmentDto.model';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-department-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './add-department-dialog.html',
  styleUrl: './add-department-dialog.css'
})
export class AddDepartmentDialog {

@Input() department!: DepartmentDto;
  private departmentService = inject(DepartmentService);
  private dialogRef = inject(MatDialogRef);
  data = inject(MAT_DIALOG_DATA) as DepartmentDto;

form = new FormGroup({
   name : new FormControl('',{
      validators: [Validators.required,Validators.minLength(6) ],
    }),
});

addDepartment(departmentDto:DepartmentDto)
  {
    if (this.form.valid && this.data) {
      console.log(this.data);
    const updated: DepartmentDto = {
      id: this.data.id,
      name: this.form.value.name ?? this.data.name
         
    };
    console.log("logger",this.data.name,this.data.id);
    this.data.name = updated.name;
    this.departmentService.postDepartment(departmentDto).subscribe({
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
