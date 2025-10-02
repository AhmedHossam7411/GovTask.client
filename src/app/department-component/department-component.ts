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
  protected editingId: number | null = null;
  protected formIsVisible = false;

  openEditForm(id: number | null)
  {
    this.formIsVisible = true;
    return this.editingId = id;
  }
  closeEditForm()
  {
    this.formIsVisible = false;
    return this.editingId = null;
  }

}
