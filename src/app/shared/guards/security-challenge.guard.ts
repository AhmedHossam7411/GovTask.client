import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { BehaviorTrackerService } from '../../services/behavior-tracker.service';

export const SecurityChallengeGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router);
  const tracker = inject(BehaviorTrackerService);
  const isChallengeActive = sessionStorage.getItem('security_challenge_active') === 'true';

  if (isChallengeActive && state.url !== '/challenge') {
    // User is trying to navigate away while a challenge is active — record as a
    // bypass attempt and redirect. Returning a UrlTree makes the redirect part
    // of this navigation (atomic), rather than racing an imperative navigate().
    tracker.recordUnauthorizedAttempt();
    return router.parseUrl('/challenge');
  }

  return true;
};
