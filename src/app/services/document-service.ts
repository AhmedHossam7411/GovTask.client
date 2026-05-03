import { inject, Injectable } from '@angular/core';
import { documentDto } from '../document-component/documentDto';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getDocuments(): Observable<documentDto[]> {
    return this.http.get<documentDto[]>
      (`${this.apiUrl}/Document/AllDocuments`);
  }

  deleteDocument(id: number): Observable<void> {
    return this.http.delete<void>
      (`${this.apiUrl}/Document/${id}`);
  }

  putDocument(id: number, documentDto: documentDto): Observable<documentDto> {
    return this.http.put<documentDto>
      (`${this.apiUrl}/Document/${id}`
        , documentDto)
  }

  postDocument(documentDto: Pick<documentDto, "name">) {
    return this.http.post<documentDto>
      (`${this.apiUrl}/Document`, documentDto)
  }
}
