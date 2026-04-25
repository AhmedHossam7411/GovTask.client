import { Component, AfterViewInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../services/auth-service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';

declare var grecaptcha: any;

@Component({
  selector: 'app-security-challenge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './security-challenge.component.html'
})
export class SecurityChallengeComponent implements AfterViewInit {
  captchaToken: string | null = null;
  private auth = inject(Auth);
  private router = inject(Router);
  private http = inject(HttpClient);

  ngAfterViewInit() {
    this.renderCaptcha();
  }

  renderCaptcha() {
    if (typeof grecaptcha !== 'undefined' && typeof grecaptcha.render !== 'undefined') {
      try {
        grecaptcha.render('recaptcha-container', {
          'sitekey': '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI', // Google's testing key
          'callback': (response: string) => this.onCaptchaComplete(response),
          'expired-callback': () => this.onCaptchaExpired()
        });
      } catch (e) {
        // Handle widget already rendered issue
      }
    } else {
      setTimeout(() => this.renderCaptcha(), 100);
    }
  }

  onCaptchaComplete(response: string) {
    this.captchaToken = response;
  }

  onCaptchaExpired() {
    this.captchaToken = null;
  }

  submitChallenge() {
    if (!this.captchaToken) return;
    
    // POST to backend verify-challenge endpoint
    this.http.post<{success: boolean}>(`${environment.apiUrl}/Auth/verify-challenge`, { token: this.captchaToken }, { withCredentials: true })
      .subscribe({
        next: (res) => {
          if (res.success) {
            sessionStorage.removeItem('security_challenge_active');
            let prev = sessionStorage.getItem('pre_challenge_url') || '/departments';
            this.router.navigate([prev]);
          } else {
            alert('Captcha verification failed on server.');
          }
        },
        error: (err) => {
          console.error(err);
          alert('Captcha verification failed.');
        }
      });
  }

  cancelAndLogout() {
    this.auth.logout().subscribe(() => {
       this.router.navigate(['/login']);
    });
  }
}
