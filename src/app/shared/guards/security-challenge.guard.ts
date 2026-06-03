import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { BehaviorTrackerService } from '../../services/behavior-tracker.service';

export const SecurityChallengeGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router);
  const tracker = inject(BehaviorTrackerService);
  const isChallengeActive = sessionStorage.getItem('security_challenge_active') === 'true';

  if (isChallengeActive && state.url !== '/challenge') {
    
    
    
    tracker.recordUnauthorizedAttempt();
    return router.parseUrl('/challenge');
  }

  return true;
};
