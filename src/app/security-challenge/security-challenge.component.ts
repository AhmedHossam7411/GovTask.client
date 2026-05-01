import { Component, AfterViewInit, ViewChild, ElementRef, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../services/auth-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

declare var grecaptcha: any;

@Component({
  selector: 'app-security-challenge',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './security-challenge.component.html'
})
export class SecurityChallengeComponent implements AfterViewInit {
  @ViewChild('recaptchaContainer') recaptchaContainer!: ElementRef;
  
  recaptchaToken: string | null = null;
  v3Token: string | null = null;
  hasError: boolean = false;
  isV3Verifying: boolean = true;

  private auth = inject(Auth);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  ngAfterViewInit() {
    this.renderCaptcha();
  }

  renderCaptcha() {
    if (typeof grecaptcha !== 'undefined' && grecaptcha.render && grecaptcha.execute) {
      // Render v2 Checkbox
      grecaptcha.render(this.recaptchaContainer.nativeElement, {
        'sitekey': '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
        'callback': (token: string) => {
          this.recaptchaToken = token;
          this.hasError = false;
          this.cdr.markForCheck();
        },
        'expired-callback': () => {
          this.recaptchaToken = null;
          this.cdr.markForCheck();
        }
      });

      // Execute v3 Background Check
      grecaptcha.ready(() => {
        grecaptcha.execute('6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI', { action: 'challenge' })
          .then((token: string) => {
            this.v3Token = token;
            this.isV3Verifying = false;
            this.cdr.markForCheck();
            console.log('v3 Token:', token);
          })
          .catch((err: any) => {
            console.error('v3 Error:', err);
            this.isV3Verifying = false;
            this.cdr.markForCheck();
          });
      });
    } else {
      // Retry after 500ms if script not loaded yet
      setTimeout(() => this.renderCaptcha(), 500);
    }
  }

  submitChallenge() {
    if (this.recaptchaToken) {
      sessionStorage.removeItem('security_challenge_active');
      let prev = sessionStorage.getItem('pre_challenge_url') || '/departments';
      this.router.navigate([prev]);
    } else {
      this.hasError = true;
    }
  }

  cancelAndLogout() {
    const logoutRes = this.auth.logout();
    if (logoutRes && logoutRes.subscribe) {
        logoutRes.subscribe(() => { this.router.navigate(['/login']); });
    } else {
        this.router.navigate(['/login']);
    }
  }
}
