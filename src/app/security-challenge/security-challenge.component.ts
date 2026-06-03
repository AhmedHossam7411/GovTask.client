import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, inject, ChangeDetectorRef
} from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Auth } from '../services/auth-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-security-challenge',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './security-challenge.component.html'
})
export class SecurityChallengeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('clickCanvas') clickCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('codeCanvas')  codeCanvas!:  ElementRef<HTMLCanvasElement>;

  private auth   = inject(Auth);
  private router = inject(Router);
  private http   = inject(HttpClient);
  private cdr    = inject(ChangeDetectorRef);

  triggerReason = 'Suspicious behavior detected';
  timeLeft      = 120;
  attempts      = 0;
  readonly maxAttempts = 3;
  hasError      = false;
  errorMessage  = '';
  isSuspending  = false;

  currentStep: 1 | 2 | 3 = 1;

  questions: { q1: string; q2: string } | null = null;
  private challengeAnswers: { a1: string; a2: string } | null = null;
  fetchingQuestions = true;
  answer1 = '';
  answer2 = '';
  knowledgeError = '';

  readonly TARGET_COUNT = 5;
  clickTargets: Array<{ x: number; y: number; num: number; hit: boolean }> = [];
  nextExpected = 1;
  orderSolved  = false;
  private readonly CLICK_W = 300;
  private readonly CLICK_H = 130;
  private readonly RADIUS  = 20;

  private verificationCode = '';
  userInput = '';

  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.triggerReason    = sessionStorage.getItem('challenge_reason') || 'Suspicious behavior detected';
    this.verificationCode = this.generateCode();

    this.loadConfig();
  }

  private async loadConfig(): Promise<void> {

    const controller = new AbortController();
    const bail = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch('assets/challenge-config.json', { cache: 'no-store', signal: controller.signal });
      if (!res.ok) throw new Error('config not found');
      const cfg = await res.json();
      this.questions        = { q1: cfg.q1, q2: cfg.q2 };
      this.challengeAnswers = { a1: cfg.a1, a2: cfg.a2 };
    } catch {
      this.questions        = { q1: 'Config missing — copy challenge-config.example.json to challenge-config.json', q2: '' };
      this.challengeAnswers = { a1: '', a2: '' };
    } finally {
      clearTimeout(bail);
      this.fetchingQuestions = false;

      this.startCountdown();

      this.cdr.markForCheck();
    }
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.clearTimer();
  }

  get canVerifyKnowledge(): boolean {
    return this.answer1.trim().length > 0 && this.answer2.trim().length > 0 && !this.fetchingQuestions;
  }

  verifyKnowledge(): void {
    const cfg = this.challengeAnswers;
    const ok  = !!cfg &&
      this.answer1.trim().toLowerCase() === cfg.a1.trim().toLowerCase() &&
      this.answer2.trim().toLowerCase() === cfg.a2.trim().toLowerCase();

    if (ok) {
      this.currentStep = 2;
      setTimeout(() => { this.initClickChallenge(); this.drawCode(); }, 0);
      return;
    }

    this.answer1 = '';
    this.answer2 = '';
    this.attempts++;
    if (this.attempts >= this.maxAttempts) {
      this.clearTimer();
      this.suspendAndLogout();
      return;
    }
    const left = this.maxAttempts - this.attempts;
    this.knowledgeError = `Incorrect answers. ${left} attempt${left === 1 ? '' : 's'} remaining.`;
  }

  private initClickChallenge(): void {
    this.clickTargets = [];
    this.nextExpected = 1;
    this.orderSolved  = false;

    const margin   = this.RADIUS + 10;
    const minDist  = this.RADIUS * 2 + 12;

    for (let n = 1; n <= this.TARGET_COUNT; n++) {
      let placed = false;
      for (let attempt = 0; attempt < 300; attempt++) {
        const x = this.rand(margin, this.CLICK_W - margin);
        const y = this.rand(margin, this.CLICK_H - margin);
        if (!this.clickTargets.some(t => Math.hypot(t.x - x, t.y - y) < minDist)) {
          this.clickTargets.push({ x, y, num: n, hit: false });
          placed = true;
          break;
        }
      }
      if (!placed) {
        // Fallback: evenly spaced row
        const spacing = (this.CLICK_W - margin * 2) / (this.TARGET_COUNT - 1);
        this.clickTargets.push({ x: margin + (n - 1) * spacing, y: this.CLICK_H / 2, num: n, hit: false });
      }
    }

    this.drawClickCanvas();
  }

  private drawClickCanvas(): void {
    const canvas = this.clickCanvas?.nativeElement;
    if (!canvas) return;

    canvas.width  = this.CLICK_W;
    canvas.height = this.CLICK_H;
    const ctx = canvas.getContext('2d')!;

    // Background
    const grad = ctx.createLinearGradient(0, 0, this.CLICK_W, this.CLICK_H);
    grad.addColorStop(0, '#1e3a5f');
    grad.addColorStop(1, '#0f2040');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.CLICK_W, this.CLICK_H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth   = 1;
    for (let x = 0; x < this.CLICK_W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.CLICK_H); ctx.stroke(); }
    for (let y = 0; y < this.CLICK_H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.CLICK_W, y); ctx.stroke(); }

    // Draw circles
    for (const t of this.clickTargets) {
      const isNext = t.num === this.nextExpected && !this.orderSolved;

      // Glow for the next target
      if (isNext) {
        ctx.shadowColor = 'rgba(59,130,246,0.7)';
        ctx.shadowBlur  = 14;
      }

      ctx.beginPath();
      ctx.arc(t.x, t.y, this.RADIUS, 0, Math.PI * 2);

      if (t.hit) {
        ctx.fillStyle   = '#22c55e';
        ctx.strokeStyle = '#16a34a';
      } else if (isNext) {
        ctx.fillStyle   = '#3b82f6';
        ctx.strokeStyle = '#93c5fd';
      } else {
        ctx.fillStyle   = 'rgba(255,255,255,0.12)';
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      }

      ctx.lineWidth = 2.5;
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Number label
      ctx.font         = `bold 15px monospace`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = t.hit ? 'white' : (isNext ? 'white' : 'rgba(255,255,255,0.6)');
      ctx.fillText(t.num.toString(), t.x, t.y);
    }
  }

  onCanvasClick(e: MouseEvent): void {
    if (this.orderSolved) return;

    const canvas = this.clickCanvas.nativeElement;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = this.CLICK_W / rect.width;
    const scaleY = this.CLICK_H / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top)  * scaleY;

    for (const t of this.clickTargets) {
      if (Math.hypot(mx - t.x, my - t.y) <= this.RADIUS) {
        if (t.num === this.nextExpected) {
          t.hit = true;
          this.nextExpected++;
          if (this.nextExpected > this.TARGET_COUNT) {
            this.orderSolved = true;
          }
        } else {
          // Wrong order — reset hit state, keep positions
          this.clickTargets.forEach(c => c.hit = false);
          this.nextExpected = 1;
        }
        this.drawClickCanvas();
        return;
      }
    }
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  private drawCode(): void {
    const canvas = this.codeCanvas?.nativeElement;
    if (!canvas) return;

    const W = canvas.width  = 260;
    const H = canvas.height = 80;
    const ctx = canvas.getContext('2d')!;

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#f0f4ff');
    bg.addColorStop(1, '#e8edf8');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 120; i++) {
      ctx.beginPath();
      ctx.arc(this.rand(0,W), this.rand(0,H), this.rand(0.5,1.5), 0, Math.PI*2);
      ctx.fillStyle = `rgba(${Math.floor(this.rand(80,180))},${Math.floor(this.rand(80,180))},${Math.floor(this.rand(80,180))},0.4)`;
      ctx.fill();
    }
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(this.rand(0,W*0.4), this.rand(0,H));
      ctx.bezierCurveTo(this.rand(W*0.2,W*0.6), this.rand(0,H), this.rand(W*0.4,W*0.8), this.rand(0,H), this.rand(W*0.6,W), this.rand(0,H));
      ctx.strokeStyle = `rgba(${Math.floor(this.rand(60,160))},${Math.floor(this.rand(60,160))},${Math.floor(this.rand(100,200))},0.35)`;
      ctx.lineWidth   = this.rand(1,2.5);
      ctx.stroke();
    }

    const palette = ['#1e3a8a','#7c3aed','#b91c1c','#065f46','#92400e','#1e40af','#6d28d9','#991b1b'];
    const cw      = W / 6;
    for (let i = 0; i < this.verificationCode.length; i++) {
      ctx.save();
      ctx.translate(cw * i + cw / 2, H / 2 + this.rand(-4,4));
      ctx.rotate(this.rand(-0.35,0.35));
      ctx.font          = `900 ${Math.floor(this.rand(28,36))}px monospace`;
      ctx.fillStyle     = palette[Math.floor(this.rand(0, palette.length))];
      ctx.shadowColor   = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur    = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.textAlign     = 'center';
      ctx.textBaseline  = 'middle';
      ctx.fillText(this.verificationCode[i], 0, 0);
      ctx.restore();
    }
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc(this.rand(0,W), this.rand(0,H), this.rand(0.5,1), 0, Math.PI*2);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fill();
    }
  }

  refreshCode(): void {
    this.verificationCode = this.generateCode();
    this.userInput        = '';
    this.hasError         = false;
    this.errorMessage     = '';
    setTimeout(() => this.drawCode(), 0);
  }

  private startCountdown(): void {
    if (this.timer !== null) return;
    this.timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) { this.clearTimer(); this.suspendAndLogout(); }
      // setInterval fires outside Angular in zoneless mode — without this the
      // countdown display (and the suspend state) would freeze on screen.
      this.cdr.markForCheck();
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timer !== null) { clearInterval(this.timer); this.timer = null; }
  }

  get canVerify(): boolean {
    return this.orderSolved && this.userInput.trim().length === 6;
  }

  verify(): void {
    if (!this.orderSolved) {
      this.hasError     = true;
      this.errorMessage = 'Complete the number challenge first.';
      return;
    }
    if (this.userInput.trim().toUpperCase() !== this.verificationCode) {
      this.attempts++;
      this.hasError  = true;
      this.userInput = '';
      if (this.attempts >= this.maxAttempts) { this.clearTimer(); this.suspendAndLogout(); return; }
      this.errorMessage = `Incorrect code. ${this.maxAttempts - this.attempts} attempt${this.maxAttempts - this.attempts === 1 ? '' : 's'} remaining.`;
      this.refreshCode();
      this.initClickChallenge();
      return;
    }
    this.clearTimer();
    sessionStorage.removeItem('security_challenge_active');
    sessionStorage.removeItem('challenge_reason');
    this.router.navigate([sessionStorage.getItem('pre_challenge_url') || '/departments']);
  }

  private suspendAndLogout(): void {
    this.isSuspending = true;
    this.http.post(`${environment.apiUrl}/Security/suspend-user`, {}, { withCredentials: true })
      .subscribe({ next: () => this.logout(), error: () => this.logout() });
  }

  logout(): void {
    sessionStorage.clear();
    const res = this.auth.logout();
    if (res?.subscribe) { res.subscribe({ complete: () => this.router.navigate(['/login']) }); }
    else { this.router.navigate(['/login']); }
  }

  private rand(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  get formattedTime(): string {
    const m = Math.floor(this.timeLeft / 60);
    const s = this.timeLeft % 60;
    return `${m}:${s < 10 ? '0' + s : s}`;
  }

  get timerColor(): string {
    if (this.timeLeft > 60) return 'text-yellow-600';
    if (this.timeLeft > 20) return 'text-orange-600';
    return 'text-red-600';
  }

  get timerBg(): string {
    if (this.timeLeft > 60) return 'bg-yellow-50 border-yellow-200';
    if (this.timeLeft > 20) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200 animate-pulse';
  }
}
