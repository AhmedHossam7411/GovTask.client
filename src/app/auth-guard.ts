import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth } from './services/auth-service';
import { Observable, of, catchError, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  
  private router = inject(Router); 
  private auth = inject(Auth);

canActivate(): Observable<boolean> {

  console.log('Guard check');

  const token = this.auth.getToken();

  // If access token exists, allow immediately
  if (token) {
    return of(true);
  }

  // If no access token, attempt silent refresh
  return this.auth.refresh().pipe(
    map(() => true),
    catchError(() => {
      this.router.navigate(['login']);
      return of(false);
    })
    );
  }

}
