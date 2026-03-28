import { Component, EventEmitter, Inject, inject, input, Output } from '@angular/core';
import { DepartmentDto } from './departmentDto.model';
import { DepartmentService } from '../services/department-Service';
import { EditForm } from "./edit-form/edit-form";
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeleteConfirmDialog } from './deleteDept-dialog/deleteDept-dialog';
import { ViewDetailsDialog } from '../shared/view-details-dialog/view-details-dialog';
@Component({
  selector: 'app-department-component',
  imports: [MatDialogModule],
  templateUrl: './department-component.html',
  styleUrl: './department-component.css',
})

export class DepartmentComponent {
  department = input.required<DepartmentDto>();
  protected editingId: number | null = null;
  protected formIsVisible = false;
  private dialogRef = inject(MatDialog);
  
  @Output() itemEdited = new EventEmitter<DepartmentDto>();
  @Output() itemDeleted = new EventEmitter<number>();
  
  openEditDialog(department : DepartmentDto)
 {
   const dialogRef = this.dialogRef.open(EditForm,{
    data : department
   });
   dialogRef.afterClosed().subscribe(res => {
     if (res) {
       this.itemEdited.emit(res);
     }
   });
 }
 openDeleteDialog(department : DepartmentDto)
 {
   const dialogRef = this.dialogRef.open(DeleteConfirmDialog,{
    data : department
   });
   dialogRef.afterClosed().subscribe(res => {
     if (res === 'confirm') {
       this.itemDeleted.emit(department.id);
     }
    });
  } 

  openViewDialog(department: DepartmentDto) {
    this.dialogRef.open(ViewDetailsDialog, {
      data: { entity: department, type: 'Department' },
      panelClass: 'custom-dialog-container'
    });
  }

}