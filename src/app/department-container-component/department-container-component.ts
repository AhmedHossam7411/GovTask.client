import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { DepartmentService } from '../services/department-Service';
import { DepartmentDto } from '../department-component/departmentDto.model';
import { DepartmentComponent } from "../department-component/department-component";
import { AddDepartmentDialog } from '../department-component/add-department-dialog/add-department-dialog';
import { MatDialog } from '@angular/material/dialog';


@Component({
  selector: 'app-department-container-component',
  imports: [DepartmentComponent],
  templateUrl: './department-container-component.html',
  styleUrl: './department-container-component.css'
})
export class DepartmentContainerComponent implements OnInit {
  protected departments: DepartmentDto[] = [];
  private departmentService = inject(DepartmentService);
  private errorMessage:string = '';
  private dialogRef = inject(MatDialog);
  #cdr = inject(ChangeDetectorRef)
  ngOnInit() {
    this.loadDepartments();
  }
  
  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (data) => {
        this.departments = data
        this.#cdr.markForCheck()
      },
      error: (err) => this.errorMessage = 'failed to fetch departments' + err
    });
  }

   openAddDialog()
   {
   const dialogRef = this.dialogRef.open(AddDepartmentDialog);
   dialogRef.afterClosed().subscribe((newDepartment : DepartmentDto) => {
    if(newDepartment)
    {
      this.departments.push(newDepartment);
    }
   });
 }
  
}


