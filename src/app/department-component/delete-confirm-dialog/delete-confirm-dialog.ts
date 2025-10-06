import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DepartmentService } from '../../services/department-Service';
import { DepartmentDto } from '../departmentDto.model';

@Component({
  selector: 'app-delete-confirm-dialog',
  imports: [],
  templateUrl: './delete-confirm-dialog.html',
  styleUrl: './delete-confirm-dialog.css'
})
export class DeleteConfirmDialog {
  private departmentService = inject(DepartmentService);
  private dialogRef = inject(MatDialogRef);
  data = inject(MAT_DIALOG_DATA) as DepartmentDto;

  confirmDelete()
  {
    if(this.data && this.data.id)
    {
      this.departmentService.deleteDepartment(this.data.id)
      .subscribe({
        next : () => {
          this.dialogRef.close('confirm');
        },
        error: (err) => {
          console.log(err);
          this.dialogRef.close('error');
        }
      });
    }
  }
  protected closeDialog()
   {
    this.dialogRef.close();
   }
}
