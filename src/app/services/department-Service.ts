import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable, of } from 'rxjs';
import { DepartmentDto } from '../department-component/departmentDto.model';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
   private http = inject(HttpClient);
   private apiUrl= environment.apiUrl;
   
   getDepartments(): Observable<DepartmentDto[]>
   {
    return of ( [{
      name:"dummy name",
      id: "id number"
    },
    {
      name:"dummy name1",
      id: "id number1"
    },
  {
      name:"dummy name2",
      id: "id number2"
    }] )
    // return this.http.get<DepartmentDto[]>(this.apiUrl);
   }
   deleteDepartment(id: string):Observable<void>
   {
    return this,this.http.delete<void>(`${this.apiUrl}/${id}`);
   }
}
