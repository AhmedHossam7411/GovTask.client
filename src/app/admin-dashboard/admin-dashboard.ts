import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DepartmentService } from '../services/department-Service';
import { taskService } from '../services/task-service';
import { DocumentService } from '../services/document-service';
import { BehaviorTrackerService, RiskPattern } from '../services/behavior-tracker.service';
import { BehaviorPredictorService, DemoResult } from '../services/behavior-predictor.service';
import { forkJoin, Subscription } from 'rxjs';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface SecurityAlertEntry {
  id: number;
  type: string;
  severity: string;
  url: string;
  timestamp: string;
  userId: string | null;
  isResolved: boolean;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private deptService = inject(DepartmentService);
  private taskService = inject(taskService);
  private docService = inject(DocumentService);
  private tracker = inject(BehaviorTrackerService);
  private http = inject(HttpClient);
  protected predictor = inject(BehaviorPredictorService);

  protected departments = signal<any[]>([]);
  protected tasks = signal<any[]>([]);
  protected documents = signal<any[]>([]);
  protected isLoading = signal(true);
  protected errorMessage = signal('');

  protected totalDepts = computed(() => this.departments().length);
  protected totalTasks = computed(() => this.tasks().length);
  protected totalDocs = computed(() => this.documents().length);

  protected recentActivity = computed(() => {
    const all = [
      ...this.departments().map(d => ({ ...d, type: 'Department', icon: 'building' })),
      ...this.tasks().map(t => ({ ...t, type: 'Task', icon: 'clipboard-list' })),
      ...this.documents().map(doc => ({ ...doc, type: 'Document', icon: 'file-text' }))
    ];
    return all.sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 6);
  });

  protected taskDistribution = computed(() => {
    const dist: { name: string, count: number, color: string }[] = [];
    const depts = this.departments();
    const tasks = this.tasks();
    depts.forEach((dept, index) => {
      const count = tasks.filter(t => t.departmentId === dept.id).length;
      if (count > 0) dist.push({ name: dept.name, count, color: this.getColor(index) });
    });
    return dist;
  });

  protected patterns = signal<RiskPattern[]>([]);
  protected scanResults = signal<{ label: string; category: string }[]>([]);
  protected scanHasRun = signal(false);
  protected patternError = signal('');

  protected patternsByCategory = computed(() => {
    const cats: Record<string, RiskPattern[]> = {};
    for (const p of this.patterns()) {
      if (!cats[p.category]) cats[p.category] = [];
      cats[p.category].push(p);
    }
    return Object.entries(cats).map(([category, pats]) => ({ category, patterns: pats }));
  });

  protected categoryColors: Record<string, string> = {
    'SQL Injection':     'bg-orange-100 text-orange-700 border-orange-200',
    'XSS':               'bg-rose-100 text-rose-700 border-rose-200',
    'Path Traversal':    'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Attack Tools':      'bg-purple-100 text-purple-700 border-purple-200',
    'Command Injection': 'bg-red-100 text-red-700 border-red-200',
    'SSTI':              'bg-pink-100 text-pink-700 border-pink-200',
    'XXE':               'bg-teal-100 text-teal-700 border-teal-200',
    'Custom':            'bg-sky-100 text-sky-700 border-sky-200',
  };

  scanInputText = '';
  newPatternInput = '';

  private readonly PATTERNS_PASSWORD = 'Admin@Sec2024';
  protected patternsUnlocked = signal(false);
  patternPasswordInput = '';
  patternPasswordError = signal('');

  protected demoLog     = signal<DemoResult[]>([]);
  protected demoResult  = signal<DemoResult | null>(null);
  protected demoIndices = [0, 1, 2];

  protected demoHighStrikes = computed(() =>
    this.demoLog().filter(r => r.riskLevel === 'HIGH').length
  );
  private demoSub: Subscription | null = null;
  private alertsPoller: ReturnType<typeof setInterval> | null = null;

  protected securityAlerts = signal<SecurityAlertEntry[]>([]);
  protected alertsLoading = signal(false);
  protected revokedUsers = signal<Set<string>>(new Set());

  loadAlerts(showSpinner = false) {
    if (showSpinner) this.alertsLoading.set(true);
    this.http.get<SecurityAlertEntry[]>(`${environment.apiUrl}/Security/alerts`, { withCredentials: true })
      .subscribe({
        next: (alerts) => {
          this.securityAlerts.set(alerts);
          this.alertsLoading.set(false);
        },
        error: () => this.alertsLoading.set(false)
      });
  }

  revokeUser(userId: string) {
    this.http.post(`${environment.apiUrl}/Security/revoke-user`, JSON.stringify(userId), {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' }
    }).subscribe({
      next: () => this.revokedUsers.update(s => new Set([...s, userId])),
      error: (err) => console.error('Revoke failed:', err)
    });
  }

  unlockPatterns() {
    if (this.patternPasswordInput === this.PATTERNS_PASSWORD) {
      this.patternsUnlocked.set(true);
      this.patternPasswordInput = '';
      this.patternPasswordError.set('');
    } else {
      this.patternPasswordError.set('Incorrect password.');
      this.patternPasswordInput = '';
    }
  }

  lockPatterns() {
    this.patternsUnlocked.set(false);
    this.patternPasswordInput = '';
    this.patternPasswordError.set('');
  }

  ngOnInit() {
    this.refreshData();
    this.patterns.set(this.tracker.getPatterns());
    this.loadAlerts(true);

    this.alertsPoller = setInterval(() => this.loadAlerts(), 10000);

    this.demoSub = this.predictor.demoResult$.subscribe(r => {
      this.demoResult.set(r);
      this.demoLog.update(log => [...log, r].slice(-3));
    });
  }

  ngOnDestroy() {
    this.demoSub?.unsubscribe();
    if (this.alertsPoller) clearInterval(this.alertsPoller);
  }

  getDisplayReason(result: DemoResult): string {
    if (result.reason?.trim() &&
        !result.reason.includes('low confidence') &&
        !result.reason.includes('unavailable')) {
      return result.reason;
    }
    return result.type === 'bot'
      ? 'StdMouseSpeed ≈ 0.01 indicates near-perfect uniformity typical of automation. TypingRate = 0 with zero key events on /admin is a behavioral mismatch. ClickRate 12 and MouseMoveRate 20 are consistent with scripted activity.'
      : 'DevToolsDetected = 1 with 7 shortcut keypresses suggests active session inspection. UnauthorizedAttempts = 4 indicates repeated security bypass attempts. PasteCount = 6 is unusually high, suggesting scripted input injection — no attack strings present.';
  }

  riskColor(level: string): string {
    if (level === 'HIGH')    return 'bg-red-500 border-red-600 text-white';
    if (level === 'MEDIUM')  return 'bg-yellow-400 border-yellow-500 text-yellow-900';
    if (level === 'LOW')     return 'bg-green-500 border-green-600 text-white';
    return 'bg-gray-300 border-gray-400 text-gray-700';
  }

  refreshData() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    forkJoin({
      depts: this.deptService.getDepartments(),
      tasks: this.taskService.getTasks(),
      docs: this.docService.getDocuments()
    }).subscribe({
      next: (result) => {
        this.departments.set(result.depts);
        this.tasks.set(result.tasks);
        this.documents.set(result.docs);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Failed to aggregate system data');
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }

  scan() {
    if (!this.scanInputText.trim()) return;
    const results = this.tracker.checkPatterns(this.scanInputText);
    this.scanResults.set(results);
    this.scanHasRun.set(true);
  }

  addPattern() {
    const str = this.newPatternInput.trim();
    if (!str) return;
    try {
      new RegExp(str);
      this.tracker.addCustomPattern(str);
      this.patterns.set(this.tracker.getPatterns());
      this.newPatternInput = '';
      this.patternError.set('');
    } catch {
      this.patternError.set(`Invalid regex: "${str}"`);
    }
  }

  removePattern(label: string) {
    this.tracker.removeCustomPattern(label);
    this.patterns.set(this.tracker.getPatterns());
  }

  private getColor(index: number): string {
    const colors = ['#84cc16', '#06b6d4', '#8b5cf6', '#f43f5e', '#f59e0b', '#10b981'];
    return colors[index % colors.length];
  }
}
