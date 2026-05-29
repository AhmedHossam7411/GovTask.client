import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth } from '../../services/auth-service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  private auth = inject(Auth);
  private router = inject(Router);

  canActivate(): boolean {
    if (this.auth.isAdmin()) return true;
    this.router.navigate(['/departments']);
    return false;
  }
}
