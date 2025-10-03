import { Component, EventEmitter, Inject, inject, Input, Output } from '@angular/core';
import { DepartmentDto } from './departmentDto.model';
import { DepartmentService } from '../services/department-Service';
import { EditForm } from "./edit-form/edit-form";
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-department-component',
  imports: [EditForm,MatDialogModule],
  templateUrl: './department-component.html',
  styleUrl: './department-component.css',
})
export class DepartmentComponent {
  @Input() department!: DepartmentDto; 
  @Output() delete = new EventEmitter<number>();
  private departmentService = inject(DepartmentService);
  private errorMessage: string = '';
  protected editingId: number | null = null;
  protected formIsVisible = false;
  private dialogRef = inject(MatDialog);
  
  openDialog(department : DepartmentDto)
 {
   console.log(department);
   this.dialogRef.open(EditForm,{
    data : department
   });
 }

  openEditForm(department:DepartmentDto)
  {
    this.formIsVisible = true;
    return this.editingId = department.id;
  }
  closeEditForm()
  {
    this.formIsVisible = false;
    return this.editingId = null;
  }
   onDelete()
   {
    this.delete.emit(this.department.id);
   }
}