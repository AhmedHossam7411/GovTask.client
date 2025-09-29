import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable} from 'rxjs';
import { DepartmentDto } from '../department-component/departmentDto.model';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
   private http = inject(HttpClient);
   private apiUrl= environment.apiUrl;
   
   getDepartments(): Observable<DepartmentDto[]>
   {
     return this.http.get<DepartmentDto[]>
     (`${this.apiUrl}/api/Department/AllDepartments`,);
   }

   deleteDepartment(id: string):Observable<void>
   {
    return this.http.delete<void>
    (`${this.apiUrl}/api/Department/${id}`);
   }
   putDepartment(id: string , departmentDto: DepartmentDto):Observable<DepartmentDto>
   {
     return this.http.put<DepartmentDto>
     (`${this.apiUrl}/api/Department/${id}`
      ,departmentDto)
   }
}
