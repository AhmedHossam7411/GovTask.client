import { Component, inject, input } from '@angular/core';
import { DepartmentDto } from './departmentDto.model';
import { DepartmentService } from '../services/department-Service';

@Component({
  selector: 'app-department-component',
  imports: [],
  templateUrl: './department-component.html',
  styleUrl: './department-component.css'
})
export class DepartmentComponent {
   public id = input<string>();
   public name = input.required<string>();
   private departments: DepartmentDto[] = [];
   private departmentService = inject(DepartmentService);
   private errorMessage:string = '';

   ngOnInit() {
    this.loadDepartments();
  }

  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (data) => this.departments = data,
      error: (err) => this.errorMessage = 'failed to fetch departments' + err
    });
  }
  deleteDepartment(id: string) {
  if (confirm('Are you sure you want to delete this department?')) {
    this.departmentService.deleteDepartment(id).subscribe({
      next: () => {
        this.departments = this.departments.filter(d => d.id !== id);
      },
      error: (err) => console.error(err)
    });
  }
}
}

