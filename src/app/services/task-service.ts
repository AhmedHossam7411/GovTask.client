import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.prod';
import { Observable } from 'rxjs';
import { taskDto } from '../tasks/taskDto';

@Injectable({
  providedIn: 'root'
})
export class taskService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getTasks(): Observable<taskDto[]> {
    return this.http.get<taskDto[]>
      (`${this.apiUrl}/Task/AllTasks`);
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>
      (`${this.apiUrl}/Task/${id}`);
  }
  putTask(name: string, taskDto: taskDto): Observable<taskDto> {
    return this.http.put<taskDto>
      (`${this.apiUrl}/Task/${name}`
        , taskDto)
  }
  postTask(taskDto: taskDto) {
    return this.http.post<taskDto>
      (`${this.apiUrl}/Task`, taskDto)
  }
}
