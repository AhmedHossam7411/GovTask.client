import { Injectable, OnDestroy } from '@angular/core';

interface MouseEventData {
  x: number;
  y: number;
  timestamp: number;
  type: 'move' | 'click';
}

interface KeyEventData {
  key: string;
  timestamp: number;
  type: 'down' | 'up';
}

@Injectable({
  providedIn: 'root',
})
export class BehaviorTrackerService implements OnDestroy {
  private mouseEvents: MouseEventData[] = [];
  private keyEvents: KeyEventData[] = [];

  private lastMouseMoveTime: number | null = null;
  private lastMousePosition: { x: number; y: number } | null = null;
  private mouseSpeeds: number[] = [];
  private mouseIdleTimes: number[] = [];

  private keyDownTimestamps = new Map<string, number>();
  private keyDwellTimes: number[] = [];
  private keyFlightTimes: number[] = [];
  private lastKeyDownTime: number | null = null;

  constructor() {
    this.startTracking();
  }

  private startTracking() {
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('click', this.handleClick);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private handleMouseMove = (event: MouseEvent) => {
    const now = performance.now();

    if (this.lastMouseMoveTime && this.lastMousePosition) {
      const deltaTime = now - this.lastMouseMoveTime;

      const deltaX = event.clientX - this.lastMousePosition.x;
      const deltaY = event.clientY - this.lastMousePosition.y;

      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      const speed = distance / deltaTime; // px per ms

      this.mouseSpeeds.push(speed);
      this.mouseIdleTimes.push(deltaTime);

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

  private handleClick = (event: MouseEvent) => {
    this.mouseEvents.push({
      x: event.clientX,
      y: event.clientY,
      timestamp: performance.now(),
      type: 'click',
    });
    console.log('click count now:', this.mouseEvents.length);
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    const now = performance.now();

    if (this.lastKeyDownTime) {
      const flight = now - this.lastKeyDownTime;
      this.keyFlightTimes.push(flight);
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
      this.keyDwellTimes.push(dwell);

      console.log('Dwell time:', dwell);
      this.keyDownTimestamps.delete(event.key);
    }
  };

  getMouseEvents() {
    return this.mouseEvents;
  }

  getKeyEvents() {
    return this.keyEvents;
  }

  clearData() {
    this.mouseEvents = [];
    this.keyEvents = [];
  }

  ngOnDestroy(): void {
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('click', this.handleClick);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}
