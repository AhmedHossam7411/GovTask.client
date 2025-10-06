import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth } from './services/auth-service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  
  private router = inject(Router); 
  private auth = inject(Auth);
  
 canActivate(): boolean {

  console.log('Guard check');
  const token = this.auth.getToken();
  if (!token) return this.redirect();

  const payload = JSON.parse(atob(token.split('.')[1]));
  const isExpired = Date.now() > payload.exp * 1000;
  if (isExpired) return this.redirect();

  return true;
}

redirect() {
  this.router.navigate(['login']);
  return false;
}
  
}
