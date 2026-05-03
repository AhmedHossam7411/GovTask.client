import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';

export const SecurityChallengeGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router);
  const isChallengeActive = sessionStorage.getItem('security_challenge_active') === 'true';

  if (isChallengeActive) {
    if (state.url !== '/challenge') {
      router.navigate(['/challenge']);
      return false;
    }
    return true;
  }

  return true;
};
