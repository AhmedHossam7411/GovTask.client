import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';

export interface RiskPattern {
  regex: RegExp;
  label: string;
  category: 'SQL Injection' | 'XSS' | 'Path Traversal' | 'Attack Tools' | 'Custom';
  removable: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BehaviorTrackerService {
  public snapshotComplete$ = new Subject<any>();
  private lastClickTime: number | null = null;
  private mouseDownTime: number | null = null;

  private clickIntervals: number[] = [];
  private clickDurations: number[] = [];
  private preClickSpeeds: number[] = [];

  private lastMouseMoveTime: number | null = null;
  private lastMousePosition: { x: number; y: number } | null = null;
  private mouseSpeeds: number[] = [];
  private mouseIdleTimes: number[] = [];

  private keyDownTimestamps = new Map<string, number>();
  private keyDwellTimes: number[] = [];
  private keyFlightTimes: number[] = [];
  private lastKeyDownTime: number | null = null;
  private keystrokeBuffer: string = '';
  private readonly MAX_BUFFER_SIZE = 100;
  private detectedPatterns: string[] = [];

  private riskPatterns: RiskPattern[] = [
    // SQL Injection
    { regex: /UNION\s+SELECT/i,     label: 'UNION SELECT',       category: 'SQL Injection', removable: false },
    { regex: /SELECT\s+.*\s+FROM/i, label: 'SELECT...FROM',      category: 'SQL Injection', removable: false },
    { regex: /OR\s+1=1/i,           label: 'OR 1=1',             category: 'SQL Injection', removable: false },
    { regex: /'--/,                 label: "'--",                category: 'SQL Injection', removable: false },
    { regex: /DROP\s+TABLE/i,       label: 'DROP TABLE',         category: 'SQL Injection', removable: false },
    { regex: /TRUNCATE\s+TABLE/i,   label: 'TRUNCATE TABLE',     category: 'SQL Injection', removable: false },
    { regex: /INFORMATION_SCHEMA/i, label: 'INFORMATION_SCHEMA', category: 'SQL Injection', removable: false },
    // XSS
    { regex: /<script/i,            label: '<script>',           category: 'XSS', removable: false },
    { regex: /onerror=/i,           label: 'onerror=',           category: 'XSS', removable: false },
    { regex: /onload=/i,            label: 'onload=',            category: 'XSS', removable: false },
    { regex: /javascript:/i,        label: 'javascript:',        category: 'XSS', removable: false },
    { regex: /alert\(/i,            label: 'alert(',             category: 'XSS', removable: false },
    { regex: /eval\(/i,             label: 'eval(',              category: 'XSS', removable: false },
    // Path Traversal
    { regex: /\.\.\//,              label: '../',                category: 'Path Traversal', removable: false },
    { regex: /\/etc\/passwd/i,      label: '/etc/passwd',        category: 'Path Traversal', removable: false },
    { regex: /\.env/i,              label: '.env',               category: 'Path Traversal', removable: false },
    { regex: /config\.json/i,       label: 'config.json',        category: 'Path Traversal', removable: false },
    { regex: /config\.php/i,        label: 'config.php',         category: 'Path Traversal', removable: false },
    // Attack Tools
    { regex: /phpinfo\(\)/i,        label: 'phpinfo()',          category: 'Attack Tools', removable: false },
    { regex: /admin\.php/i,         label: 'admin.php',          category: 'Attack Tools', removable: false },
    { regex: /wp-admin/i,           label: 'wp-admin',           category: 'Attack Tools', removable: false },
    { regex: /shell/i,              label: 'shell',              category: 'Attack Tools', removable: false },
    { regex: /cmd\.exe/i,           label: 'cmd.exe',            category: 'Attack Tools', removable: false },
  ];

  public urgentAnomalyDetected$ = new Subject<{ reason: string; detectedUrl: string }>();

  private http: HttpClient = inject(HttpClient);
  private windowTimer: any = null;
  private routerSubscription: Subscription | null = null;
  private isTracking = false;
  private context: 'preAuth' | 'postAuth' = 'preAuth';
  private sessionId: string = this.generateSessionId();
  private router = inject(Router);
  private currentPage: string = '';
  private interval = 30000;

  currentModule() {
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        // Check the raw URL before Angular guards or redirects process it.
        // This is the only place where the original typed URL is still intact.
        this.checkStringForRisk(this.safeDecode(event.url), 'URL', event.url);

      } else if (event instanceof NavigationEnd) {
        // Flush the behavior snapshot for the page being left
        const snapshot = this.getBehaviorSnapshot();
        if (snapshot.mouseMoveCount >= 5 || snapshot.keyEventCount > 3) {
          console.log(`Flushing behavior snapshot for old page before navigating...`);
          this.http.post(`${environment.apiUrl}/Behavior/snapshot`, snapshot, { withCredentials: true }).subscribe({
            error: (err) => console.error('Behavior snapshot failed:', err)
          });
          this.snapshotComplete$.next(snapshot);
        }

        this.clearData();
        this.resetTimer();
        this.currentPage = event.urlAfterRedirects;
      }
    });
  }

  // ── Pattern management ──────────────────────────────────────────────────────

  getPatterns(): RiskPattern[] {
    return [...this.riskPatterns];
  }

  addCustomPattern(patternStr: string): void {
    const regex = new RegExp(patternStr, 'i');
    this.riskPatterns.push({ regex, label: patternStr, category: 'Custom', removable: true });
  }

  removeCustomPattern(label: string): void {
    const idx = this.riskPatterns.findIndex(p => p.removable && p.label === label);
    if (idx !== -1) this.riskPatterns.splice(idx, 1);
  }

  // Returns matched patterns — used by admin panel and console testInput/checkPatterns
  checkPatterns(text: string): { label: string; category: string }[] {
    const decoded = this.safeDecode(text);
    const matches = this.riskPatterns
      .filter(p => p.regex.test(decoded))
      .map(p => ({ label: p.label, category: p.category }));
    if (matches.length) {
      console.warn(`[DEV] ${matches.length} match(es) for "${text}":`, matches.map(m => m.label).join(', '));
    } else {
      console.log(`[DEV] No patterns matched for "${text}"`);
    }
    return matches;
  }

  simulateInput(text: string): boolean {
    return this.checkStringForRisk(text, 'Input');
  }

  simulateUrl(url: string): boolean {
    return this.checkStringForRisk(this.safeDecode(url), 'URL');
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private safeDecode(text: string): string {
    try { return decodeURIComponent(text); } catch { return text; }
  }

  private checkStringForRisk(text: string, source: 'URL' | 'Input', sourceUrl?: string): boolean {
    for (const p of this.riskPatterns) {
      if (p.regex.test(text)) {
        const label = `[${p.category}] ${p.label} in ${source}`;
        console.warn(`SECURITY ALERT: ${label}`);

        // Record the pattern so it travels with the next snapshot to the DB
        if (!this.detectedPatterns.includes(label)) {
          this.detectedPatterns.push(label);
        }

        this.urgentAnomalyDetected$.next({
          reason: `[${p.category}] ${p.label} detected in ${source}`,
          detectedUrl: sourceUrl ?? this.currentPage
        });
        return true;
      }
    }
    return false;
  }

  private resetTimer() {
    if (this.windowTimer) {
      clearInterval(this.windowTimer);
      this.windowTimer = null;
    }
    this.startWindowTimer();
  }

  generateSessionId(): string {
    const existing = sessionStorage.getItem('behaviorSessionId');
    if (existing) {
      this.sessionId = existing;
      return this.sessionId;
    } else {
      this.sessionId = crypto.randomUUID();
      sessionStorage.setItem('behaviorSessionId', this.sessionId);
      return this.sessionId;
    }
  }

  setContext(ctx: 'preAuth' | 'postAuth' = 'preAuth') {
    this.context = ctx;
    console.log('Behavior context switched to: ', ctx);
  }

  start() {
    if (this.isTracking) return;
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);

    console.log('Behavior tracking STARTED');
    this.isTracking = true;
    this.currentModule();
    this.startWindowTimer();
  }

  startWindowTimer() {
    console.log('Starting window timer for behavior snapshot...');
    console.log(this.getContext());
    if (this.windowTimer) return;

    this.windowTimer = setInterval(() => {
      const snapshot = this.getBehaviorSnapshot();
      if (snapshot.mouseMoveCount >= 5 || snapshot.keyEventCount > 3) {
        console.log('Sending window snapshot:', snapshot);
        this.http.post(`${environment.apiUrl}/Behavior/snapshot`, snapshot, { withCredentials: true })
          .subscribe({ error: (err) => console.error('Behavior snapshot failed:', err) });
        console.log('Behavior snapshot sent successfully');
        this.snapshotComplete$.next(snapshot);
      }
      this.clearData();
    }, this.interval);
  }

  private pushWithLimit<T>(arr: T[], value: T, limit = 200) {
    arr.push(value);
    if (arr.length > limit) arr.shift();
  }

  private handleMouseDown = (_event: MouseEvent) => {
    this.mouseDownTime = performance.now();
  };

  private handleMouseUp = (_event: MouseEvent) => {
    const now = performance.now();
    if (this.mouseDownTime) {
      this.pushWithLimit(this.clickDurations, now - this.mouseDownTime);
    }
    if (this.lastClickTime) {
      this.pushWithLimit(this.clickIntervals, now - this.lastClickTime);
    }
    if (this.mouseSpeeds.length > 0) {
      this.pushWithLimit(this.preClickSpeeds, this.mouseSpeeds[this.mouseSpeeds.length - 1]);
    }
    this.lastClickTime = now;
  };

  private handleMouseMove = (event: MouseEvent) => {
    const now = performance.now();
    if (this.lastMouseMoveTime && this.lastMousePosition) {
      const deltaTime = now - this.lastMouseMoveTime;
      const deltaX = event.clientX - this.lastMousePosition.x;
      const deltaY = event.clientY - this.lastMousePosition.y;
      const speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;
      this.pushWithLimit(this.mouseSpeeds, speed);
      this.pushWithLimit(this.mouseIdleTimes, deltaTime);
    }
    this.lastMouseMoveTime = now;
    this.lastMousePosition = { x: event.clientX, y: event.clientY };
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    const now = performance.now();
    if (this.lastKeyDownTime) {
      this.pushWithLimit(this.keyFlightTimes, now - this.lastKeyDownTime);
    }
    this.keyDownTimestamps.set(event.key, now);
    this.lastKeyDownTime = now;

    if (event.key.length === 1) {
      this.keystrokeBuffer += event.key;
      if (this.keystrokeBuffer.length > this.MAX_BUFFER_SIZE) {
        this.keystrokeBuffer = this.keystrokeBuffer.substring(this.keystrokeBuffer.length - this.MAX_BUFFER_SIZE);
      }
      this.checkStringForRisk(this.keystrokeBuffer, 'Input', this.currentPage);
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      this.keystrokeBuffer = '';
    }
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    const now = performance.now();
    const downTime = this.keyDownTimestamps.get(event.key);
    if (downTime) {
      this.pushWithLimit(this.keyDwellTimes, now - downTime);
      this.keyDownTimestamps.delete(event.key);
    }
  };

  getContext() {
    return this.context;
  }

  private getUserIdFromToken(): string | null {
    const token = localStorage.getItem('access-Token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
        || payload.nameid || payload.sub || payload.uid || payload.UserId || null;
    } catch {
      return null;
    }
  }

  getBehaviorSnapshot() {
    console.log('Generating behavior snapshot now...');
    const windowSeconds = 30;
    return {
      sessionId: this.sessionId,
      userId: this.getUserIdFromToken(),
      context: this.context,
      currentPage: this.currentPage,
      timestamp: new Date().toISOString(),
      avgMouseSpeed: this.average(this.mouseSpeeds),
      stdMouseSpeed: this.std(this.mouseSpeeds),
      mouseMoveCount: this.mouseSpeeds.length,
      avgMouseIdle: this.average(this.mouseIdleTimes),
      stdMouseIdle: this.std(this.mouseIdleTimes),
      avgClickDuration: this.average(this.clickDurations),
      stdClickDuration: this.std(this.clickDurations),
      clickCount: this.clickDurations.length,
      avgPreClickSpeed: this.average(this.preClickSpeeds),
      stdPreClickSpeed: this.std(this.preClickSpeeds),
      avgClickInterval: this.average(this.clickIntervals),
      stdClickInterval: this.std(this.clickIntervals),
      avgDwell: this.average(this.keyDwellTimes),
      stdDwell: this.std(this.keyDwellTimes),
      avgFlight: this.average(this.keyFlightTimes),
      stdFlight: this.std(this.keyFlightTimes),
      keyEventCount: this.keyDwellTimes.length,
      clickRate: this.clickDurations.length / windowSeconds,
      mouseMoveRate: this.mouseSpeeds.length / windowSeconds,
      typingRate: this.keyDwellTimes.length / windowSeconds,
      sessionDuration: windowSeconds,

      // Attack string detection — set by checkStringForRisk during this window
      hackingStringDetected: this.detectedPatterns.length > 0,
      detectedPatterns: this.detectedPatterns.join('; '),
    };
  }

  private average(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  private std(arr: number[]): number {
    if (arr.length === 0) return 0;
    const mean = this.average(arr);
    return Math.sqrt(arr.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / arr.length);
  }

  stop() {
    if (!this.isTracking) {
      console.log('Tracking already stopped');
      if (this.windowTimer) {
        clearInterval(this.windowTimer);
        this.windowTimer = null;
      }
      return;
    }
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);

    if (this.windowTimer) {
      clearInterval(this.windowTimer);
      this.windowTimer = null;
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
      this.routerSubscription = null;
    }

    console.log('Behavior tracking STOPPED');
    this.isTracking = false;
  }

  clearData(): void {
    this.mouseSpeeds = [];
    this.mouseIdleTimes = [];
    this.lastMouseMoveTime = null;
    this.lastMousePosition = null;
    this.clickIntervals = [];
    this.clickDurations = [];
    this.preClickSpeeds = [];
    this.lastClickTime = null;
    this.mouseDownTime = null;
    this.keyDwellTimes = [];
    this.keyFlightTimes = [];
    this.keyDownTimestamps.clear();
    this.lastKeyDownTime = null;
    this.keystrokeBuffer = '';
    this.detectedPatterns = [];
    console.log('Behavior data cleared.');
  }
}
