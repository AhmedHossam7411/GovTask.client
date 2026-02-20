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
  providedIn: 'root'
})
export class BehaviorTrackerService implements OnDestroy {

  private mouseEvents: MouseEventData[] = [];
  private keyEvents: KeyEventData[] = [];

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
    this.mouseEvents.push({
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now(),
      type: 'move'
    });
    console.log('mouse movement tracked', this.mouseEvents.length);
  };

  private handleClick = (event: MouseEvent) => {
    this.mouseEvents.push({
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now(),
      type: 'click'
    });
    console.log('click count now:', this.mouseEvents.length);
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    console.log('KEY DOWN', event.key);
    this.keyEvents.push({
      key: event.key,
      timestamp: Date.now(),
      type: 'down'
    });
    console.log('Key count now:', this.keyEvents.length);
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    this.keyEvents.push({
      key: event.key,
      timestamp: Date.now(),
      type: 'up'
    });
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