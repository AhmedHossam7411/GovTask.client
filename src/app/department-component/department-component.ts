import { Component, EventEmitter, inject, Input, input, Output, output } from '@angular/core';
import { DepartmentDto } from './departmentDto.model';
import { DepartmentService } from '../services/department-Service';
import { EditForm } from "./edit-form/edit-form";
import { Dialog } from '@angular/cdk/dialog';

@Component({
  selector: 'app-department-component',
  imports: [EditForm],
  templateUrl: './department-component.html',
  styleUrl: './department-component.css',
})
export class DepartmentComponent {
  @Input() department!: DepartmentDto; 
  @Output() delete = new EventEmitter<number>();
  private departmentService = inject(DepartmentService);
  private errorMessage: string = '';
  protected editingId: number | null = null;
  protected formIsVisible = false;
  private dialog = inject(Dialog);
  
   protected openModal(department:DepartmentDto)
   {
    this.dialog.open(EditForm)
   }

  openEditForm(department:DepartmentDto)
  {
    this.formIsVisible = true;
    return this.editingId = department.id;
  }
  closeEditForm()
  {
    this.formIsVisible = false;
    return this.editingId = null;
  }
   onDelete()
   {
    this.delete.emit(this.department.id);
   }
}