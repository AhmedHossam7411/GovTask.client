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
  constructor() {
  console.log("Auth service created");
}

  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  private accessToken: string | null = null;
  private authState = new BehaviorSubject<boolean>(false);
  authState$ = this.authState.asObservable();

  login(data: LoginRequest): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/api/Auth/login`
      , data , {withCredentials: true})
      .pipe(
        tap(res => {
          this.accessToken = res.accessToken;
          this.authState.next(true);
        })
      );
  }

  refresh():  Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/api/Auth/refresh`,
      {},
      {withCredentials: true}
    ).pipe(
      tap(res => {
        this.accessToken = res.accessToken;
        this.authState.next(true);
      })
    )
  }

  register(data: RegisterRequest): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/api/Auth/register`, data)
      .pipe(
        tap(res => {
          this.accessToken = res.accessToken;
          this.authState.next(true);
        })
      );
  }

  logout(): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/api/Auth/logout`,
      {},
      {withCredentials: true}
    ).pipe(
      tap(() => {
        this.accessToken = null;
        this.authState.next(false);
      })
    );
  }

  getToken() {
    return this.accessToken;
  }

}