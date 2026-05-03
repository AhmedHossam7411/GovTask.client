import { ChangeDetectorRef, Component, inject, OnInit, signal, computed } from '@angular/core';
import { DepartmentService } from '../services/department-Service';
import { DepartmentDto } from '../department-component/departmentDto.model';
import { DepartmentComponent } from "../department-component/department-component";
import { AddDepartmentDialog } from '../department-component/add-department-dialog/add-department-dialog';
import { MatDialog } from '@angular/material/dialog';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggle } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-department-container-component',
  imports: [DepartmentComponent],
  templateUrl: './department-container-component.html',
  styleUrl: './department-container-component.css'
})
export class DepartmentContainerComponent implements OnInit {
  protected departments = signal<DepartmentDto[]>([]);
  public searchTerm = signal('');
  
  protected filteredDepartments = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.departments();
    return this.departments().filter(d => 
      d.name.toLowerCase().includes(term) || 
      d.id.toString().includes(term)
    );
  });
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
        this.departments.set(data);
        this.#cdr.markForCheck();
      },
      error: (err) => this.errorMessage = 'failed to fetch departments' + err
    });
  }

  openAddDialog(){
   const dialogRef = this.dialogRef.open(AddDepartmentDialog);
   dialogRef.afterClosed().subscribe((newDepartment : DepartmentDto) => {
    if(newDepartment)
    {
      this.departments.update(deps => [...deps, newDepartment]);
      this.#cdr.markForCheck();
    }
   });
 }

  onDepartmentEdited(updatedDepartment: DepartmentDto) {
    this.departments.update(deps => deps.map(d => 
      d.id === updatedDepartment.id ? updatedDepartment : d
    ));
    this.#cdr.markForCheck();
  }

  onDepartmentDeleted(deletedId: number) {
    this.departments.update(deps => deps.filter(d => d.id !== deletedId));
    this.#cdr.markForCheck();
  }
  
}


