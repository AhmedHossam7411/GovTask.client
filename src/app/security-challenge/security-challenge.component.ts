import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, HostListener, inject
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
  @ViewChild('bgCanvas')    bgCanvas!:    ElementRef<HTMLCanvasElement>;
  @ViewChild('pieceCanvas') pieceCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('codeCanvas')  codeCanvas!:  ElementRef<HTMLCanvasElement>;

  private auth   = inject(Auth);
  private router = inject(Router);
  private http   = inject(HttpClient);

  // ── General state ───────────────────────────────────────────────────────────
  triggerReason = 'Suspicious behavior detected';
  timeLeft      = 60;
  attempts      = 0;
  readonly maxAttempts = 3;
  hasError      = false;
  errorMessage  = '';
  isSuspending  = false;

  // ── Code challenge ──────────────────────────────────────────────────────────
  private verificationCode = '';
  userInput = '';

  // ── Slider challenge ────────────────────────────────────────────────────────
  private readonly BG_W  = 300;
  private readonly BG_H  = 100;
  private readonly GAP_W = 52;
  private readonly GAP_H = 84;
  readonly GAP_Y         = 8;   // (BG_H - GAP_H) / 2

  private gapX          = 0;
  sliderX               = 8;    // current piece left offset
  isDragging            = false;
  sliderSolved          = false;
  private dragStartMouseX  = 0;
  private dragStartSliderX = 0;

  private timer: ReturnType<typeof setInterval> | null = null;

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit() {
    this.triggerReason    = sessionStorage.getItem('challenge_reason') || 'Suspicious behavior detected';
    this.verificationCode = this.generateCode();
    this.startCountdown();
  }

  ngAfterViewInit() {
    this.gapX = Math.floor(this.rand(this.GAP_W + 30, this.BG_W - this.GAP_W - 10));
    this.drawSlider();
    this.drawCode();
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  // ── Slider ──────────────────────────────────────────────────────────────────

  private drawSlider(): void {
    const bg    = this.bgCanvas.nativeElement;
    const piece = this.pieceCanvas.nativeElement;

    bg.width     = this.BG_W;
    bg.height    = this.BG_H;
    piece.width  = this.GAP_W;
    piece.height = this.GAP_H;

    // Draw full texture on offscreen canvas first
    const off    = document.createElement('canvas');
    off.width    = this.BG_W;
    off.height   = this.BG_H;
    const offCtx = off.getContext('2d')!;
    this.drawBgTexture(offCtx, this.BG_W, this.BG_H);

    // Copy notch region to piece canvas
    const pieceData = offCtx.getImageData(this.gapX, this.GAP_Y, this.GAP_W, this.GAP_H);
    piece.getContext('2d')!.putImageData(pieceData, 0, 0);

    // Draw background + notch hole on main canvas
    const bgCtx = bg.getContext('2d')!;
    bgCtx.drawImage(off, 0, 0);

    bgCtx.fillStyle   = 'rgba(0,0,0,0.45)';
    bgCtx.fillRect(this.gapX, this.GAP_Y, this.GAP_W, this.GAP_H);
    bgCtx.strokeStyle = 'rgba(255,255,255,0.6)';
    bgCtx.lineWidth   = 1.5;
    bgCtx.setLineDash([4, 3]);
    bgCtx.strokeRect(this.gapX, this.GAP_Y, this.GAP_W, this.GAP_H);
    bgCtx.setLineDash([]);
  }

  private drawBgTexture(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#1e3a5f');
    grad.addColorStop(1, '#0f2040');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth   = 1;
    for (let x = 0; x < w; x += 18) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
    for (let y = 0; y < h; y += 18) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }

    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.arc(this.rand(0,w), this.rand(0,h), this.rand(3,15), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${this.rand(0.04,0.12).toFixed(2)})`;
      ctx.fill();
    }
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(255,255,255,${this.rand(0.1,0.4).toFixed(2)})`;
      ctx.fillRect(this.rand(0,w), this.rand(0,h), 1, 1);
    }
  }

  onDragStart(e: MouseEvent): void {
    e.preventDefault();
    if (this.sliderSolved) return;
    this.isDragging       = true;
    this.dragStartMouseX  = e.clientX;
    this.dragStartSliderX = this.sliderX;
  }

  onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (this.sliderSolved) return;
    this.isDragging       = true;
    this.dragStartMouseX  = e.touches[0].clientX;
    this.dragStartSliderX = this.sliderX;
  }

  @HostListener('document:mousemove', ['$event'])
  onDocMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;
    this.sliderX = Math.max(0, Math.min(
      this.BG_W - this.GAP_W,
      this.dragStartSliderX + (e.clientX - this.dragStartMouseX)
    ));
  }

  onTouchMove(e: TouchEvent): void {
    if (!this.isDragging) return;
    this.sliderX = Math.max(0, Math.min(
      this.BG_W - this.GAP_W,
      this.dragStartSliderX + (e.touches[0].clientX - this.dragStartMouseX)
    ));
  }

  @HostListener('document:mouseup')
  onDocMouseUp(): void {
    if (!this.isDragging) return;
    this.endDrag();
  }

  onTouchEnd(): void { this.endDrag(); }

  private endDrag(): void {
    this.isDragging = false;
    if (Math.abs(this.sliderX - this.gapX) <= 12) {
      this.sliderSolved = true;
      this.sliderX      = this.gapX;
    } else {
      this.sliderX = 8;
    }
  }

  // ── Code canvas ─────────────────────────────────────────────────────────────

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
    this.userInput    = '';
    this.hasError     = false;
    this.errorMessage = '';
    setTimeout(() => this.drawCode(), 0);
  }

  // ── Countdown ───────────────────────────────────────────────────────────────

  private startCountdown(): void {
    this.timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) { this.clearTimer(); this.suspendAndLogout(); }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timer !== null) { clearInterval(this.timer); this.timer = null; }
  }

  // ── Verify ──────────────────────────────────────────────────────────────────

  get canVerify(): boolean {
    return this.sliderSolved && this.userInput.trim().length === 6;
  }

  verify(): void {
    if (!this.sliderSolved) {
      this.hasError     = true;
      this.errorMessage = 'Complete the slider puzzle first.';
      return;
    }
    if (this.userInput.trim().toUpperCase() !== this.verificationCode) {
      this.attempts++;
      this.hasError  = true;
      this.userInput = '';
      if (this.attempts >= this.maxAttempts) { this.clearTimer(); this.suspendAndLogout(); return; }
      this.errorMessage = `Incorrect code. ${this.maxAttempts - this.attempts} attempt${this.maxAttempts - this.attempts === 1 ? '' : 's'} remaining.`;
      // Reset both challenges on wrong code — forces full re-solve
      this.refreshCode();
      this.sliderSolved = false;
      this.sliderX      = 8;
      return;
    }
    this.clearTimer();
    sessionStorage.removeItem('security_challenge_active');
    sessionStorage.removeItem('challenge_reason');
    this.router.navigate([sessionStorage.getItem('pre_challenge_url') || '/departments']);
  }

  // ── Suspend ─────────────────────────────────────────────────────────────────

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

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private rand(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  get timerColor(): string {
    if (this.timeLeft > 30) return 'text-yellow-600';
    if (this.timeLeft > 10) return 'text-orange-600';
    return 'text-red-600';
  }

  get timerBg(): string {
    if (this.timeLeft > 30) return 'bg-yellow-50 border-yellow-200';
    if (this.timeLeft > 10) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200 animate-pulse';
  }
}
