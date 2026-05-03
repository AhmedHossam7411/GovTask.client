import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { BehaviorTrackerService } from './behavior-tracker.service';
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
  private subscription: Subscription | null = null;
  private urgentSubscription: Subscription | null = null;

  start() {
    if (this.subscription) return;

    console.log('Behavior prediction service STARTED (Event Driven)');

    // [DEV TOOLS]: Console helpers for testing detection paths
    (window as any).simulateSecurityChallenge = () => {
      console.warn('[DEV] Forcing simulated security challenge...');
      this.triggerSecurityChallenge('DEV_SIMULATED');
    };
    (window as any).testInput = (text: string) => {
      console.log(`[DEV] Testing input detection for: "${text}"`);
      const hit = this.tracker.simulateInput(text);
      if (!hit) console.log('[DEV] No pattern matched.');
    };
    (window as any).testUrl = (url: string) => {
      console.log(`[DEV] Testing URL detection for: "${url}"`);
      const hit = this.tracker.simulateUrl(url);
      if (!hit) console.log('[DEV] No pattern matched.');
    };
    (window as any).checkPatterns    = (text: string) => this.tracker.checkPatterns(text);
    (window as any).simulateMaliciousBehavior = (count = 3) => this.simulateMaliciousBehavior(count);
    (window as any).getStrikes       = () => console.log(`[DEV] Current strikes: ${this.getHighRiskCount()}/3`);
    (window as any).resetStrikes     = () => { this.resetHighRiskCount(); console.log('[DEV] Strike counter reset.'); };

    this.subscription = this.tracker.snapshotComplete$.subscribe(snapshot => {
      this.checkPrediction(snapshot);
    });

    this.urgentSubscription = this.tracker.urgentAnomalyDetected$.subscribe(({ reason, detectedUrl }) => {
      console.warn('URGENT SECURITY ANOMALY:', reason, 'on', detectedUrl);
      this.triggerSecurityChallenge(reason, detectedUrl);
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
    console.log('Analyzing predict endpoint for potential anomalies...');

    this.http.post<PredictResponse>(`${environment.apiUrl}/MLPrediction/predict`, { data: [snapshot] }, { withCredentials: true })
      .subscribe({
        next: (response) => {
          console.log('Analysis Result from .NET ML integration:', response);

          if (response?.analysis?.riskLevel === 'HIGH') {
            const currentStrikes = this.incrementHighRiskCount();
            console.warn(`HIGH risk behavior detected! Strike: ${currentStrikes}/3`);
            if (currentStrikes >= 3) {
              this.triggerSecurityChallenge(`HIGH_RISK_ML_BEHAVIOR (Strike ${currentStrikes}/3)`);
            }
          } else if (response?.analysis?.riskLevel === 'MEDIUM') {
            console.warn('Medium risk behavior logged. Monitoring.');
          } else if (response?.analysis?.riskLevel === 'LOW') {
            const current = this.getHighRiskCount();
            if (current > 0) {
              sessionStorage.setItem('behaviorHighRiskCount', (current - 1).toString());
            }
          }
        },
        error: (err) => console.error('Behavior predict endpoint failed:', err)
      });
  }

  // ── Simulation ──────────────────────────────────────────────────────────────

  private simulateMaliciousBehavior(totalCount: number = 3): void {
    console.warn(`[SIM] Starting malicious behavior simulation — ${totalCount} snapshot(s)`);

    // Bot signature: values Groq flags as HIGH risk
    // - stdMouseSpeed ≈ 0    → robotic uniformity (real humans vary)
    // - typingRate/keyEvents = 0 on /admin  → context mismatch
    // - high consistent clickRate/mouseMoveRate → automated pattern
    const botSnapshot = {
      avgMouseSpeed: 2.5,   stdMouseSpeed: 0.01,
      mouseMoveCount: 150,  avgMouseIdle: 10,
      avgClickDuration: 50, clickCount: 100,
      avgClickInterval: 200,
      avgDwell: 2,          avgFlight: 2,
      keyEventCount: 0,     typingRate: 0,
      clickRate: 12,        mouseMoveRate: 20,
      sessionId: `sim-bot-${Date.now()}`,
      userId: null,
      context: 'postAuth',
      currentPage: '/admin',
    };

    // Recursive chain: wait for each response before sending the next.
    // Prevents all 3 requests racing to read the same strike count of 0.
    const sendOne = (remaining: number) => {
      if (remaining <= 0) return;
      const index = totalCount - remaining + 1;
      console.warn(`[SIM] Sending bot snapshot ${index}/${totalCount}...`);

      this.http.post<PredictResponse>(
        `${environment.apiUrl}/MLPrediction/predict`,
        { data: [{ ...botSnapshot, timestamp: new Date().toISOString() }] },
        { withCredentials: true }
      ).subscribe({
        next: (response) => {
          const risk = response?.analysis?.riskLevel;
          console.warn(`[SIM] Snapshot ${index}/${totalCount} → ${risk} (confidence: ${response?.confidence?.toFixed(2)})`);

          if (risk === 'HIGH') {
            const strikes = this.incrementHighRiskCount();
            console.warn(`[SIM] Strike ${strikes}/3`);
            if (strikes >= 3) {
              this.triggerSecurityChallenge(`HIGH_RISK_ML_BEHAVIOR (Strike ${strikes}/3)`);
              return; // Challenge fired — stop chain
            }
          }
          sendOne(remaining - 1); // Chain next snapshot
        },
        error: (err) => {
          console.error(`[SIM] Snapshot ${index} failed:`, err);
          sendOne(remaining - 1); // Continue chain even on error
        }
      });
    };

    sendOne(totalCount);
  }

  private sendSecurityAlert(reason: string, pageUrl?: string): void {
    const snapshot = this.tracker.getBehaviorSnapshot();

    const payload = {
      type: reason.startsWith('HIGH_RISK_ML') ? 'HIGH_RISK_ML_BEHAVIOR' : 'PATTERN_DETECTED',
      severity: 'CRITICAL',
      url: pageUrl ?? this.router.url,
      timestamp: new Date().toISOString(),
      detectedPattern: reason,
      snapshot: {
        ...snapshot,
        // Browser fingerprint — enriched here since tracker doesn't collect these
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenResolution: `${screen.width}x${screen.height}`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        platform: navigator.platform,
        hardwareConcurrency: navigator.hardwareConcurrency,
      }
    };

    // Fire-and-forget — don't block the challenge redirect
    this.http.post(`${environment.apiUrl}/Security/alert-admin`, payload, { withCredentials: true })
      .subscribe({
        next: () => console.log('[Security] Alert sent to admin successfully.'),
        error: (err) => console.error('[Security] Failed to send alert to admin:', err)
      });
  }

  private triggerSecurityChallenge(reason: string = 'Unknown', detectedUrl?: string) {
    console.warn('CRITICAL: Security threshold reached. Reason:', reason);

    // Alert admin BEFORE stopping the tracker so getBehaviorSnapshot() still has data
    this.sendSecurityAlert(reason, detectedUrl);

    this.resetHighRiskCount();
    this.tracker.stop();
    this.stop();

    sessionStorage.setItem('security_challenge_active', 'true');
    sessionStorage.setItem('pre_challenge_url', this.router.url);

    this.router.navigate(['/challenge']);
  }

  stop() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    if (this.urgentSubscription) {
      this.urgentSubscription.unsubscribe();
      this.urgentSubscription = null;
    }
    console.log('Behavior prediction service STOPPED.');
  }
}
