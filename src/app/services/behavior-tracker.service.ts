import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BehaviorTrackerService {
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

  private isTracking = false;
  private context : 'preAuth' | 'postAuth' = 'preAuth';
  setContext(ctx:'preAuth' | 'postAuth' = 'preAuth' ){
    this.context = ctx;
    console.log("Behavior context switched to: ",ctx);
  }
  
  start() {
    if (this.isTracking) {
      console.log("Tracking already active");
      return;
    }
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    
    console.log("Behavior tracking STARTED");
    this.isTracking = true;
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
    console.log("Click duration:", duration);
  }
  
  // Interval between clicks
  if (this.lastClickTime) {
    const interval = now - this.lastClickTime;
    this.pushWithLimit(this.clickIntervals, interval);
    console.log("Click interval:", interval);
  }
  
  // Speed before click (if exists)
  if (this.mouseSpeeds.length > 0) {
    const lastSpeed = this.mouseSpeeds[this.mouseSpeeds.length - 1];
    this.pushWithLimit(this.preClickSpeeds, lastSpeed);
    console.log("Pre-click speed:", lastSpeed);
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
      
      console.log('Mouse deltaTime:', deltaTime);
      console.log('Mouse distance:', distance);
      console.log('Mouse speed:', speed);
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
      console.log('Flight time:', flight);
    }
    
    this.keyDownTimestamps.set(event.key, now);
    this.lastKeyDownTime = now;
  };
  
  private handleKeyUp = (event: KeyboardEvent) => {
    const now = performance.now();
    const downTime = this.keyDownTimestamps.get(event.key);
    
    if (downTime) {
      const dwell = now - downTime;
      this.pushWithLimit(this.keyFlightTimes, dwell);
      
      console.log('Dwell time:', dwell);
      this.keyDownTimestamps.delete(event.key);
    }
  };
  
  getContext(){
    return this.context;
  }

  getBehaviorSnapshot() {
    return {
      avgMouseSpeed: this.average(this.mouseSpeeds),
      avgMouseIdle: this.average(this.mouseIdleTimes),
      avgDwell: this.average(this.keyDwellTimes),
      avgFlight: this.average(this.keyFlightTimes),
    };
  }
  
  private average(arr: number[]): number {
    if (arr.length === 0) return 0;
    console.log('Behavior Snapshot:', this.getBehaviorSnapshot());
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
  
  stop() {
  if (!this.isTracking) {
    console.log("Tracking already stopped");
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
