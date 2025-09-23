import { inject, Injectable } from '@angular/core';
import { LoginRequest } from '../login/Login-request.model';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegisterRequest } from '../register/register-Request.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Auth { 
   private apiUrl = environment.apiUrl;
   private http = inject(HttpClient);

  login(data: LoginRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/Auth/login`, data);
  }
  register(data: RegisterRequest): Observable<object> {
      return this.http.post(`${this.apiUrl}/api/Auth/register`, data);
    }
}
