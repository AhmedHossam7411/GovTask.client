import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
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

  private authState = new BehaviorSubject<boolean>(this.hasValidToken());
  authState$ = this.authState.asObservable();

  login(data: LoginRequest): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/api/Auth/login`, data)
      .pipe(
        tap(res => {
          localStorage.setItem('authToken', res.token);
          this.authState.next(true);
        })
      );
  }

  register(data: RegisterRequest): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/api/Auth/register`, data)
      .pipe(
        tap(res => {
          localStorage.setItem('authToken', res.token);
          this.authState.next(true);
        })
      );
  }

  logout() {
    localStorage.removeItem('authToken');
    this.authState.next(false);
  }

  getToken() {
    return localStorage.getItem('authToken');
  }

  private hasValidToken(): boolean {
    const token = localStorage.getItem('authToken');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
}