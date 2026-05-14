import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { BehaviorTrackerService } from '../../services/behavior-tracker.service';

export const SecurityChallengeGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router);
  const tracker = inject(BehaviorTrackerService);
  const isChallengeActive = sessionStorage.getItem('security_challenge_active') === 'true';

  if (isChallengeActive) {
    if (state.url !== '/challenge') {
      // User is trying to navigate away while a challenge is active — record as bypass attempt
      tracker.recordUnauthorizedAttempt();
      router.navigate(['/challenge']);
      return false;
    }
    return true;
  }

  return true;
};
