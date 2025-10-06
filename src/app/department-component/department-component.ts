import { Component, EventEmitter, Inject, inject, input, Output } from '@angular/core';
import { DepartmentDto } from './departmentDto.model';
import { DepartmentService } from '../services/department-Service';
import { EditForm } from "./edit-form/edit-form";
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeleteConfirmDialog } from './delete-confirm-dialog/delete-confirm-dialog';
import { AddDepartmentDialog } from './add-department-dialog/add-department-dialog';

@Component({
  selector: 'app-department-component',
  imports: [MatDialogModule],
  templateUrl: './department-component.html',
  styleUrl: './department-component.css',
})

export class DepartmentComponent {
  department = input.required<DepartmentDto>();
  private departmentService = inject(DepartmentService);
  private errorMessage: string = '';
  protected editingId: number | null = null;
  protected formIsVisible = false;
  private dialogRef = inject(MatDialog);
  
  openEditDialog(department : DepartmentDto)
 {
   
   this.dialogRef.open(EditForm,{
    data : department
   });
 }
 openDeleteDialog(department : DepartmentDto)
 {
   this.dialogRef.open(DeleteConfirmDialog,{
    data : department
   });
 } 

}