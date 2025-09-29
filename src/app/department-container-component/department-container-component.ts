import { Component, inject, Input } from '@angular/core';
import { DepartmentService } from '../services/department-Service';
import { DepartmentDto } from '../department-component/departmentDto.model';
import { DepartmentComponent } from "../department-component/department-component";


@Component({
  selector: 'app-department-container-component',
  imports: [DepartmentComponent],
  templateUrl: './department-container-component.html',
  styleUrl: './department-container-component.css'
})
export class DepartmentContainerComponent {
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
        console.log("data", this.departments)
      },
      error: (err) => this.errorMessage = 'failed to fetch departments' + err
    });
  }
 
  }


