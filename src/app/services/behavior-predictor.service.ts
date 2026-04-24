import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { BehaviorTrackerService } from './behavior-tracker.service';
import { Auth } from './auth-service'; // Assumed import based on app.ts constructor

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

  private predictTimer: any = null;
  private interval = 45000; // 45 seconds polling interval

  start() {
    if (this.predictTimer) return;

    console.log("Behavior prediction service STARTED (45s interval)");

    // We launch the interval
    this.predictTimer = setInterval(() => {
      this.checkPrediction();
    }, this.interval);
  }

  private checkPrediction() {
    console.log("Analyzing predict endpoint for potential anomalies...");

    // 1. We gather the current snapshot
    // Since this is a separate service, calling getting the snapshot from the tracker works
    // nicely to bundle up the recent user interactions within the last 45s.
    const snapshot = this.tracker.getBehaviorSnapshot();
    const payload = { data: [snapshot] };

    // 2. We send it directly to the .NET predict endpoint
    this.http.post<PredictResponse>(`${environment.apiUrl}/MLPrediction/predict`, payload, { withCredentials: true })
      .subscribe({
        next: (response) => {
          console.log("Analysis Result from .NET ML integration:", response);

          if (response?.analysis?.riskLevel === 'HIGH') {
            this.triggerSecurityChallenge();
          } else if (response?.analysis?.riskLevel === 'MEDIUM') {
            console.warn("Medium risk behavior logged. Monitoring.");
          }
        },
        error: (err) => {
          console.error("Behavior predict endpoint failed:", err);
        }
      });
  }

  private triggerSecurityChallenge() {
    console.warn("CRITICAL: HIGH risk behavior detected! Halting active sessions.");

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
    if (this.predictTimer) {
      clearInterval(this.predictTimer);
      this.predictTimer = null;
      console.log("Behavior prediction service STOPPED.");
    }
  }
}
