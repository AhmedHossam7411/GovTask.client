import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../../services/auth-service';

export const ChallengeGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(Auth);

  const isActive = sessionStorage.getItem('security_challenge_active') === 'true';
  if (isActive) return true;

  router.navigate([auth.getToken() ? '/departments' : '/login']);
  return false;
};
