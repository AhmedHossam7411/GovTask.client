import { Component, inject, Input, OnInit } from '@angular/core';
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

  
  deleteRow(id : string) {
    
    this.departments = this.departments.filter(d => d.id !== id);
    
  }
  
  }


