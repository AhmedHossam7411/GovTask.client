import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { BehaviorTrackerService } from './behavior-tracker.service';
import { Auth } from './auth-service'; // Assumed import based on app.ts constructor
import { Subscription } from 'rxjs';

export interface PredictResponse {
  confidence: number;
  analysis: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
    reason: string;
    context?: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class BehaviorPredictorService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private tracker = inject(BehaviorTrackerService);

  // Note: Depending on your exact auth service implementation, you may need to adjust this.
  // The app.ts used private auth: Auth
  private auth = inject(Auth);

  private subscription: Subscription | null = null;

  start() {
    if (this.subscription) return;

    console.log("Behavior prediction service STARTED (Event Driven)");

    this.subscription = this.tracker.snapshotComplete$.subscribe(snapshot => {
      this.checkPrediction(snapshot);
    });
  }

  private getHighRiskCount(): number {
    return parseInt(sessionStorage.getItem('behaviorHighRiskCount') || '0', 10);
  }

  private incrementHighRiskCount(): number {
    const count = this.getHighRiskCount() + 1;
    sessionStorage.setItem('behaviorHighRiskCount', count.toString());
    return count;
  }

  private resetHighRiskCount(): void {
    sessionStorage.removeItem('behaviorHighRiskCount');
  }

  private checkPrediction(snapshot: any) {
    console.log("Analyzing predict endpoint for potential anomalies...");

    const payload = { data: [snapshot] };

    // 2. We send it directly to the .NET predict endpoint
    this.http.post<PredictResponse>(`${environment.apiUrl}/MLPrediction/predict`, payload, { withCredentials: true })
      .subscribe({
        next: (response) => {
          console.log("Analysis Result from .NET ML integration:", response);

          if (response?.analysis?.riskLevel === 'HIGH') {
            const currentStrikes = this.incrementHighRiskCount();
            console.warn(`HIGH risk behavior detected! Strike: ${currentStrikes}/3`);

            if (currentStrikes >= 3) {
              this.triggerSecurityChallenge();
            }
          } else if (response?.analysis?.riskLevel === 'MEDIUM') {
            console.warn("Medium risk behavior logged. Monitoring.");
          } else if (response?.analysis?.riskLevel === 'LOW') {
            // Optional: Reward long periods of normal behavior by decreasing the strike count
            const current = this.getHighRiskCount();
            if (current > 0) {
              sessionStorage.setItem('behaviorHighRiskCount', (current - 1).toString());
            }
          }
        },
        error: (err) => {
          console.error("Behavior predict endpoint failed:", err);
        }
      });
  }

  private triggerSecurityChallenge() {
    console.warn("CRITICAL: HIGH risk behavior threshold reached! Halting active sessions.");
    this.resetHighRiskCount();

    // 1. Stop all tracking immediately
    this.tracker.stop();
    this.stop();

    // 2. Clear credentials directly via Auth Service
    // Note: Use whatever robust logout/clear mechanism Auth provides.
    if (typeof this.auth.logout === 'function') {
      this.auth.logout();
    }

    // 3. Request a security challenge by routing the user out
    // If you have a specific page like /challenge or /login, redirect there.
    this.router.navigate(['/login'], { queryParams: { challenge: 'anomaly_detected' } });
  }

  stop() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
      console.log("Behavior prediction service STOPPED.");
    }
  }
}
