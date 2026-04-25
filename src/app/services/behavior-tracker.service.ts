import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { filter } from 'rxjs/internal/operators/filter';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';

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

  private http: HttpClient = inject(HttpClient);
  private windowTimer: any = null;
  private isTracking = false;
  private context: 'preAuth' | 'postAuth' = 'preAuth';
  private sessionId: string = this.generateSessionId();
  private router = inject(Router);
  private currentPage: string = '';
  private interval = 30000;


  currentModule() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // 1. Force flush the pending behavior snapshot labeled under the OLD page
        const snapshot = this.getBehaviorSnapshot();
        if (snapshot.mouseMoveCount >= 5 || snapshot.keyEventCount > 3) {
          console.log(`Flushing behavior snapshot for old page before navigating...`);
          this.http.post(`${environment.apiUrl}/Behavior/snapshot`, snapshot, { withCredentials: true }).subscribe({
            error: (err) => console.error("Behavior snapshot failed:", err)
          });
          this.snapshotComplete$.next(snapshot);
        }

        // 2. Clear metrics, restart the 30s timer, and only then update the page
        this.clearData();
        this.resetTimer();
        this.currentPage = event.urlAfterRedirects;
      });
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
    console.log("Behavior context switched to: ", ctx);
  }

  start() {
    if (this.isTracking) return;
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);

    console.log("Behavior tracking STARTED");
    this.isTracking = true;
    this.currentModule();
    this.startWindowTimer();
  }

  startWindowTimer() {
    console.log("Starting window timer for behavior snapshot...");
    console.log(this.getContext());
    if (this.windowTimer) return;

    this.windowTimer = setInterval(() => {
      const snapshot = this.getBehaviorSnapshot();

      if (snapshot.mouseMoveCount >= 5 || snapshot.keyEventCount > 3) {
        console.log("Sending window snapshot:", snapshot);

        this.http.post(`${environment.apiUrl}/Behavior/snapshot`, snapshot, { withCredentials: true })
          .subscribe({
            error: (err) => console.error("Behavior snapshot failed:", err)
          });
        console.log("Behavior snapshot sent successfully");
        this.snapshotComplete$.next(snapshot);
      }
      this.clearData();
    }, this.interval);
  }

  private pushWithLimit<T>(arr: T[], value: T, limit = 200) {
    arr.push(value);
    if (arr.length > limit) {
      arr.shift();
    }
  }

  private handleMouseDown = (event: MouseEvent) => {
    this.mouseDownTime = performance.now();
  };
  private handleMouseUp = (event: MouseEvent) => {
    const now = performance.now();

    // Duration (how long button was held)
    if (this.mouseDownTime) {
      const duration = now - this.mouseDownTime;
      this.pushWithLimit(this.clickDurations, duration);
    }

    // Interval between clicks
    if (this.lastClickTime) {
      const interval = now - this.lastClickTime;
      this.pushWithLimit(this.clickIntervals, interval);
    }

    // Speed before click (if exists)
    if (this.mouseSpeeds.length > 0) {
      const lastSpeed = this.mouseSpeeds[this.mouseSpeeds.length - 1];
      this.pushWithLimit(this.preClickSpeeds, lastSpeed);
    }

    this.lastClickTime = now;
  };

  private handleMouseMove = (event: MouseEvent) => {
    const now = performance.now();

    if (this.lastMouseMoveTime && this.lastMousePosition) {
      const deltaTime = now - this.lastMouseMoveTime;

      const deltaX = event.clientX - this.lastMousePosition.x;
      const deltaY = event.clientY - this.lastMousePosition.y;

      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      const speed = distance / deltaTime; // px per ms

      this.pushWithLimit(this.mouseSpeeds, speed);
      this.pushWithLimit(this.mouseIdleTimes, deltaTime);

    }

    this.lastMouseMoveTime = now;
    this.lastMousePosition = {
      x: event.clientX,
      y: event.clientY,
    };
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    const now = performance.now();

    if (this.lastKeyDownTime) {
      const flight = now - this.lastKeyDownTime;
      this.pushWithLimit(this.keyFlightTimes, flight);
    }

    this.keyDownTimestamps.set(event.key, now);
    this.lastKeyDownTime = now;
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    const now = performance.now();
    const downTime = this.keyDownTimestamps.get(event.key);

    if (downTime) {
      const dwell = now - downTime;
      this.pushWithLimit(this.keyDwellTimes, dwell);
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
        || payload.nameid
        || payload.sub
        || payload.uid
        || payload.UserId
        || null;
    } catch {
      return null;
    }
  }

  getBehaviorSnapshot() {
    console.log("Generating behavior snapshot now...");
    const windowSeconds = 30;

    return {
      // Metadata
      sessionId: this.sessionId,
      userId: this.getUserIdFromToken(),
      context: this.context,
      currentPage: this.currentPage,
      timestamp: new Date().toISOString(),

      // Mouse
      avgMouseSpeed: this.average(this.mouseSpeeds),
      stdMouseSpeed: this.std(this.mouseSpeeds),
      mouseMoveCount: this.mouseSpeeds.length,

      avgMouseIdle: this.average(this.mouseIdleTimes),
      stdMouseIdle: this.std(this.mouseIdleTimes),

      // Clicks
      avgClickDuration: this.average(this.clickDurations),
      stdClickDuration: this.std(this.clickDurations),
      clickCount: this.clickDurations.length,
      avgPreClickSpeed: this.average(this.preClickSpeeds),
      stdPreClickSpeed: this.std(this.preClickSpeeds),

      avgClickInterval: this.average(this.clickIntervals),
      stdClickInterval: this.std(this.clickIntervals),

      // Keystrokes
      avgDwell: this.average(this.keyDwellTimes),
      stdDwell: this.std(this.keyDwellTimes),

      avgFlight: this.average(this.keyFlightTimes),
      stdFlight: this.std(this.keyFlightTimes),
      keyEventCount: this.keyDwellTimes.length,

      clickRate: this.clickDurations.length / windowSeconds,
      mouseMoveRate: this.mouseSpeeds.length / windowSeconds,
      typingRate: this.keyDwellTimes.length / windowSeconds,

      sessionDuration: windowSeconds,
    };
  }

  private average(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  private std(arr: number[]): number {
    if (arr.length === 0) return 0;

    const mean = this.average(arr);
    const variance =
      arr.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
      arr.length;

    return Math.sqrt(variance);
  }

  stop() {
    if (!this.isTracking) {
      console.log("Tracking already stopped");
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

    console.log("Behavior tracking STOPPED");
    this.isTracking = false;
  }
  clearData(): void {

    // Mouse dynamics
    this.mouseSpeeds = [];
    this.mouseIdleTimes = [];
    this.lastMouseMoveTime = null;
    this.lastMousePosition = null;

    // Click dynamics
    this.clickIntervals = [];
    this.clickDurations = [];
    this.preClickSpeeds = [];
    this.lastClickTime = null;
    this.mouseDownTime = null;

    // Keystroke dynamics
    this.keyDwellTimes = [];
    this.keyFlightTimes = [];
    this.keyDownTimestamps.clear();
    this.lastKeyDownTime = null;

    console.log("Behavior data cleared.");
  }
}
