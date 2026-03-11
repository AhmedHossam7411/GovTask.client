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
        if(token && !this.isTokenExpired(token)) {
          this.authState.next(true);
        }
    }
    private http = inject(HttpClient);
    private accessTokenKey = "access-Token";
    private authState = new BehaviorSubject<boolean>(false);
    authState$ = this.authState.asObservable();

    private isTokenExpired(token: string): boolean {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    const now = Math.floor(Date.now() / 1000);
    return exp < now;
    } 

    login(data: LoginRequest): Observable<AuthResponseDto> {
      return this.http.post<AuthResponseDto>(`${environment.apiUrl}/Auth/login`
        , data , {withCredentials: true})
        .pipe(
          tap(res => {
            localStorage.setItem(this.accessTokenKey,res.accessToken);
            this.authState.next(true);
          })
        );
    }

    refresh():  Observable<AuthResponseDto> {
      return this.http.post<AuthResponseDto>(`/api/Auth/refresh`,
        null,
        {withCredentials: true}
      ).pipe(
        tap(res => {
          localStorage.setItem(this.accessTokenKey,res.accessToken);
          this.authState.next(true);
        }),
        catchError(err => {
          console.error('refresh() error', err);
          return throwError(() => err);
        })
      )
    }

    register(data: RegisterRequest): Observable<AuthResponseDto> {
      return this.http.post<AuthResponseDto>(`/api/Auth/register`, data)
        .pipe(
          tap(res => {
            localStorage.setItem(this.accessTokenKey,res.accessToken)
            this.authState.next(true);
          })
        );
    }

    logout(): Observable<any> {
      return this.http.post(
        `/api/Auth/logout`,
        {},
        {withCredentials: true}
      ).pipe(
        tap(() => {
          localStorage.removeItem(this.accessTokenKey);
          sessionStorage.removeItem('behaviorSessionId');
          this.authState.next(false);
        })
      );
    }

    getToken() {
      return localStorage.getItem(this.accessTokenKey);
    }

  }