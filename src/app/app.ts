import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from "./header/headerComponent";
import { MatDialogModule } from '@angular/material/dialog';
import { BehaviorTrackerService } from './services/behavior-tracker.service';
import { Auth } from './services/auth-service';
import { AppMenu } from './app-menu/app-menu';

@Component({
  selector: 'app-root',
  imports: [MatDialogModule, RouterOutlet, Header,AppMenu],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {

  protected readonly title = signal('govTask');

  constructor(
    private behaviorTracker: BehaviorTrackerService,
    private auth: Auth
  ) {}

 ngOnInit(): void {
  this.auth.authState$.subscribe(isAuth => {
    if (isAuth) {
      this.behaviorTracker.setContext('postAuth');
      this.behaviorTracker.start();
    } else {
      this.behaviorTracker.setContext('preAuth');
      // this.behaviorTracker.clearData();
    }
  });
}
}