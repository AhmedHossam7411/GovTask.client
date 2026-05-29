import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject, catchError, throwError } from 'rxjs';
import { LoginRequest } from '../login/Login-request.model';
import { RegisterRequest } from '../register/register-Request.model';
import { AuthResponseDto } from '../shared/Auth-responseDto';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  constructor() {
    const token = localStorage.getItem(this.accessTokenKey);
    if (token && !this.isTokenExpired(token)) {
      this.authState.next(true);
    }
  }
  private http = inject(HttpClient);
  private accessTokenKey = "access-Token";
  private sessionId = "behaviorSessionId";
  private authState = new BehaviorSubject<boolean>(false);
  authState$ = this.authState.asObservable();

  private isTokenExpired(token: string): boolean {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    const now = Math.floor(Date.now() / 1000);
    return exp < now;
  }

  login(data: LoginRequest): Observable<AuthResponseDto> {
    console.log(environment.apiUrl);
    return this.http.post<AuthResponseDto>(`${environment.apiUrl}/Auth/login`
      , data, { withCredentials: true })
      .pipe(
        tap(res => {
          localStorage.setItem(this.accessTokenKey, res.accessToken);
          this.authState.next(true);
        })
      );
  }

  refresh(): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${environment.apiUrl}/Auth/refresh`,
      null,
      { withCredentials: true }
    ).pipe(
      tap(res => {
        localStorage.setItem(this.accessTokenKey, res.accessToken);
        this.authState.next(true);
      }),
      catchError(err => {
        console.error('refresh() error', err);
        return throwError(() => err);
      })
    )
  }

  register(data: RegisterRequest): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${environment.apiUrl}/Auth/register`, data)
      .pipe(
        tap(res => {
          localStorage.setItem(this.accessTokenKey, res.accessToken)
          this.authState.next(true);
        })
      );
  }

  logout(): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/Auth/logout`,
      {},
      { withCredentials: true }
    ).pipe(
      tap(() => {
        localStorage.removeItem(this.accessTokenKey);
        sessionStorage.removeItem(this.sessionId);
        this.authState.next(false);
      })
    );
  }

  getToken() {
    return localStorage.getItem(this.accessTokenKey);
  }

  private decodeToken(): any {
    const token = this.getToken();
    if (!token) return null;
    try { return JSON.parse(atob(token.split('.')[1])); }
    catch { return null; }
  }

  getUserName(): string {
    const p = this.decodeToken();
    if (!p) return '';
    return p['unique_name']
      ?? p['name']
      ?? p['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']
      ?? '';
  }

  getUserRole(): string {
    const p = this.decodeToken();
    if (!p) return 'User';
    return p['role']
      ?? p['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
      ?? 'User';
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'Admin';
  }

  getInitials(): string {
    return this.getUserName()
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('') || '?';
  }
}