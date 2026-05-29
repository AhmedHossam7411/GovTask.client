import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from '../services/auth-service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, CommonModule],
  templateUrl: './headerComponent.html',
  styleUrl: './headerComponent.css'
})
export class Header implements OnInit {
  protected auth = inject(Auth);
  protected title = 'Task Management System';
  imgSrc = signal('assets/logo.jpg');

  protected isLoggedIn = signal(false);
  protected userName = signal('');
  protected userRole = signal('User');
  protected initials = signal('');

  ngOnInit() {
    this.auth.authState$.subscribe(loggedIn => {
      this.isLoggedIn.set(loggedIn);
      if (loggedIn) {
        this.userName.set(this.auth.getUserName());
        this.userRole.set(this.auth.getUserRole());
        this.initials.set(this.auth.getInitials());
      } else {
        this.userName.set('');
        this.userRole.set('User');
        this.initials.set('');
      }
    });
  }

  get isAdmin(): boolean {
    return this.userRole() === 'Admin';
  }
}
