import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { Auth } from '../services/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  imports: [MatMenuModule],
  templateUrl: './app-menu.html',
  styleUrl: './app-menu.css'
})
export class AppMenu {
   private http: HttpClient = inject(HttpClient);
   private auth: Auth  = inject(Auth);
   private router = inject(Router);
   
   logout() {
    this.auth.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
        console.log("Logout successful");
      },
      error: err => {
        console.error("Logout failed", err);
      }
    });
  }
}
