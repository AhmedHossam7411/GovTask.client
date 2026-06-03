import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { BehaviorTrackerService } from './behavior-tracker.service';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';

export interface DemoResult {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  confidence: number;
  reason: string;
  type: 'bot' | 'malicious-user';
  tabpfnScore: number;
  tabpfnLabel: string;
  tabpfnVerdict: string;
}

export interface PredictResponse {
  confidence: number;
  tabpfn?: {
    score: number;
    label: string;    // "Anomaly" | "Normal"
    verdict: string;
  };
  analysis: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
    reason: string;
    context?: any;
  };
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
  private demoHttpSub: Subscription | null = null;

  private readonly maxStrikes = 2;

  readonly strikeCount$ = new BehaviorSubject<number>(
    parseInt(sessionStorage.getItem('behaviorHighRiskCount') || '0', 10)
  );
  readonly demoResult$ = new Subject<DemoResult>();
  readonly demoSending = signal(false);

  start() {
    if (this.subscription) return;

    (window as any).simulateMaliciousBehavior = (count = 3) => this.simulateMaliciousBehavior(count);
    (window as any).testInput  = (text: string) => this.tracker.simulateInput(text);
    (window as any).testUrl    = (url: string)  => this.tracker.simulateUrl(url);
    (window as any).checkPatterns = (text: string) => this.tracker.checkPatterns(text);
    (window as any).getStrikes = () => this.getHighRiskCount();
    (window as any).resetStrikes = () => this.resetHighRiskCount();

    this.subscription = this.tracker.snapshotComplete$.subscribe(snapshot => {
      this.checkPrediction(snapshot);
    });

    this.urgentSubscription = this.tracker.urgentAnomalyDetected$.subscribe(({ reason, detectedUrl }) => {
      console.warn('URGENT SECURITY ANOMALY:', reason, 'on', detectedUrl);
      this.triggerSecurityChallenge(reason, detectedUrl);
    });
  }

  private getHighRiskCount(): number {
    return this.strikeCount$.value;
  }

  private incrementHighRiskCount(): number {
    const count = this.strikeCount$.value + 1;
    sessionStorage.setItem('behaviorHighRiskCount', count.toString());
    this.strikeCount$.next(count);
    return count;
  }

  private resetHighRiskCount(): void {
    sessionStorage.removeItem('behaviorHighRiskCount');
    this.strikeCount$.next(0);
  }

  // Public demo API

  sendDemoSnapshot(): void {
    this.sendSnapshot({
      // Robotic signature: near-zero mouse variance, no typing, high uniform rates
      avgMouseSpeed: 2.5,   stdMouseSpeed: 0.01,
      mouseMoveCount: 150,  avgMouseIdle: 10,
      avgClickDuration: 50, clickCount: 100,
      avgClickInterval: 200,
      avgDwell: 2,          avgFlight: 2,
      keyEventCount: 0,     typingRate: 0,
      clickRate: 12,        mouseMoveRate: 20,
      hackingStringDetected: 0, detectedPatterns: null,
      pasteCount: 0,        suspiciousPasteDetected: 0,
      devToolsShortcutCount: 0, abnormalInputDetected: 0,
      devToolsDetected: 0,  unauthorizedAttempts: 0,
      sessionId: `demo-bot-${Date.now()}`,
      userId: null, context: 'postAuth', currentPage: '/admin',
    }, 'bot');
  }

  sendMaliciousUserSnapshot(): void {
    this.sendSnapshot({
      // Human-like biometrics — no attack strings — but suspicious signals
      avgMouseSpeed: 1.5,   stdMouseSpeed: 0.42,
      mouseMoveCount: 38,   avgMouseIdle: 280,
      avgClickDuration: 115, clickCount: 7,
      avgClickInterval: 6200,
      avgDwell: 145,        avgFlight: 310,
      keyEventCount: 30,    typingRate: 1.1,
      clickRate: 0.25,      mouseMoveRate: 1.6,
      // Attack signals — no strings, only behaviour
      hackingStringDetected: 0, detectedPatterns: null,
      pasteCount: 8,            suspiciousPasteDetected: 0,
      devToolsShortcutCount: 12, abnormalInputDetected: 0,
      devToolsDetected: 1,       unauthorizedAttempts: 7,
      sessionId: `demo-mal-${Date.now()}`,
      userId: null, context: 'postAuth', currentPage: '/admin',
    }, 'malicious-user');
  }

  private sendSnapshot(payload: Record<string, any>, type: DemoResult['type']): void {
    this.demoHttpSub?.unsubscribe();
    this.demoSending.set(true);

    this.demoHttpSub = this.http.post<PredictResponse>(
      `${environment.apiUrl}/MLPrediction/predict`,
      { data: [{ ...payload, timestamp: new Date().toISOString() }] },
      { withCredentials: true }
    ).subscribe({
      next: (response) => {
        this.demoSending.set(false);
        const risk = response?.analysis?.riskLevel ?? 'UNKNOWN';

        this.demoResult$.next({
          riskLevel: risk,
          confidence: response?.confidence ?? 0,
          reason: response?.analysis?.reason ?? '',
          type,
          tabpfnScore:   response?.tabpfn?.score   ?? response?.confidence ?? 0,
          tabpfnLabel:   response?.tabpfn?.label   ?? (response?.confidence >= 0.5 ? 'Anomaly' : 'Normal'),
          tabpfnVerdict: response?.tabpfn?.verdict ?? '',
        });

        if (risk === 'HIGH') {
          const strikes = this.incrementHighRiskCount();
          if (strikes >= this.maxStrikes) {
            this.triggerSecurityChallenge(`HIGH_RISK_ML_BEHAVIOR (Strike ${strikes}/${this.maxStrikes})`);
          }
        }
      },
      error: () => this.demoSending.set(false)
    });
  }

  resetDemo(): void {
    this.resetHighRiskCount();
  }

  private checkPrediction(snapshot: any) {
    if (this.demoSending()) return;

    const devToolsOpen = !!snapshot?.devToolsDetected;

    if (devToolsOpen) {
      const strikes = this.incrementHighRiskCount();
      if (strikes >= this.maxStrikes) {
        this.triggerSecurityChallenge(`DEVTOOLS_OPEN_DETECTED (Strike ${strikes}/${this.maxStrikes})`);
        return;
      }
    }

    this.http.post<PredictResponse>(`${environment.apiUrl}/MLPrediction/predict`, { data: [snapshot] }, { withCredentials: true })
      .subscribe({
        next: (response) => {
          // DevTools was already scored above — don't let the ML verdict double-count
          // it (HIGH) or undo it (LOW) for this snapshot.
          if (devToolsOpen) return;

          if (response?.analysis?.riskLevel === 'HIGH') {
            const currentStrikes = this.incrementHighRiskCount();
            if (currentStrikes >= this.maxStrikes) {
              this.triggerSecurityChallenge(`HIGH_RISK_ML_BEHAVIOR (Strike ${currentStrikes}/${this.maxStrikes})`);
            }
          } else if (response?.analysis?.riskLevel === 'LOW') {
            const current = this.getHighRiskCount();
            if (current > 0) {
              sessionStorage.setItem('behaviorHighRiskCount', (current - 1).toString());
            }
          }
        },
        error: (err) => console.error('Behavior prediction failed:', err)
      });
  }

  private simulateMaliciousBehavior(totalCount: number = 3): void {
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

    const sendOne = (remaining: number) => {
      if (remaining <= 0) return;

      this.http.post<PredictResponse>(
        `${environment.apiUrl}/MLPrediction/predict`,
        { data: [{ ...botSnapshot, timestamp: new Date().toISOString() }] },
        { withCredentials: true }
      ).subscribe({
        next: (response) => {
          const risk = response?.analysis?.riskLevel;
          if (risk === 'HIGH') {
            const strikes = this.incrementHighRiskCount();
            if (strikes >= this.maxStrikes) {
              this.triggerSecurityChallenge(`HIGH_RISK_ML_BEHAVIOR (Strike ${strikes}/${this.maxStrikes})`);
              return;
            }
          }
          sendOne(remaining - 1);
        },
        error: () => sendOne(remaining - 1)
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

    this.http.post(`${environment.apiUrl}/Security/alert-admin`, payload, { withCredentials: true })
      .subscribe({ error: (err) => console.error('Security alert failed:', err) });
  }

  private triggerSecurityChallenge(reason: string = 'Unknown', detectedUrl?: string) {
    this.sendSecurityAlert(reason, detectedUrl);

    this.resetHighRiskCount();
    this.tracker.stop();
    this.stop();

    sessionStorage.setItem('security_challenge_active', 'true');
    sessionStorage.setItem('pre_challenge_url', this.router.url);
    sessionStorage.setItem('challenge_reason', reason);

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
    if (this.demoHttpSub) {
      this.demoHttpSub.unsubscribe();
      this.demoHttpSub = null;
    }
    this.demoSending.set(false);
  }
}
