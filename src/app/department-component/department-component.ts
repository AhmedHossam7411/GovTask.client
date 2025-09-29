import { Component, EventEmitter, inject, Input, input, Output, output } from '@angular/core';
import { DepartmentDto } from './departmentDto.model';
import { DepartmentService } from '../services/department-Service';
import { EditForm } from "./edit-form/edit-form";

@Component({
  selector: 'app-department-component',
  imports: [EditForm],
  templateUrl: './department-component.html',
  styleUrl: './department-component.css',
})
export class DepartmentComponent {
  @Input() department!: DepartmentDto; 
  @Output() onDelete = new EventEmitter<string>();
  private departmentService = inject(DepartmentService);
  private errorMessage: string = '';
  protected editingId: string | null = null;

  openEditForm(id: string | null)
  {
    return this.editingId = id;
  }
  closeEditForm()
  {
    return this.editingId = null;
  }

  updateDepartment(id: string , departmentDto:DepartmentDto)
  {
    this.departmentService.putDepartment(id,departmentDto).subscribe({
      next: () => {
          
        },
        error: (err) => console.error(err),
    })
  }
}
