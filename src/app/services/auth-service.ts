import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginRequest } from '../login/Login-request.model';
import { RegisterRequest } from '../register/register-Request.model';
import { environment } from '../../environments/environment';
import { AuthResponseDto } from '../shared/Auth-responseDto';

@Injectable({
  providedIn: 'root'
})
export class Auth { 
   private apiUrl = environment.apiUrl;
   private http = inject(HttpClient);

  login(data: LoginRequest): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/api/Auth/login`, data)
    .pipe(tap(res => localStorage.setItem('authToken',res.token) ));
  }
  register(data: RegisterRequest): Observable<AuthResponseDto> {
      return this.http.post<AuthResponseDto>(`${this.apiUrl}/api/Auth/register`, data)
      .pipe(tap(res => localStorage.setItem('authToken',res.token) ));
    }
    getToken(){
      return localStorage.getItem('authToken');
    }
}
