import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from "./header/headerComponent";
import { RegisterComponent } from "./register/registerComponent";
import { LoginComponent } from "./login/loginComponent";
import { MatDialogModule } from '@angular/material/dialog';
import { BehaviorTrackerService } from './services/behavior-tracker.service';

@Component({
  selector: 'app-root',
  imports: [MatDialogModule,RouterOutlet, Header, RegisterComponent, LoginComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor(private behaviorTracker: BehaviorTrackerService) {
    console.log('Behavior tracker started');
     setTimeout(() => {
    console.log('Mouse events:', this.behaviorTracker.getMouseEvents().length);
    console.log('Key events:', this.behaviorTracker.getKeyEvents().length);
  }, 5000);
  }
  protected readonly title = signal('govTask');
}
