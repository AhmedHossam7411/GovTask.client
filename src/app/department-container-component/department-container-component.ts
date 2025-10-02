import { Component, inject, OnInit } from '@angular/core';
import { DepartmentService } from '../services/department-Service';
import { DepartmentDto } from '../department-component/departmentDto.model';
import { DepartmentComponent } from "../department-component/department-component";


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
  
  ngOnInit() {
    this.loadDepartments();
  }
  
  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (data) => {
        this.departments = data
      },
      error: (err) => this.errorMessage = 'failed to fetch departments' + err
    });
  }

  
  deleteRow(id : number) {
    if (confirm('Are you sure you want to delete this department?')) {
      this.departmentService.deleteDepartment(id).subscribe({
        next: () => {
           this.loadDepartments(); 
        },
        error: (err) => console.error(err),
      });
    }

   }
  
  }


