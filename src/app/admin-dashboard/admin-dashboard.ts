import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DepartmentService } from '../services/department-Service';
import { taskService } from '../services/task-service';
import { DocumentService } from '../services/document-service';
import { BehaviorTrackerService, RiskPattern } from '../services/behavior-tracker.service';
import { forkJoin } from 'rxjs';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit {
  private deptService = inject(DepartmentService);
  private taskService = inject(taskService);
  private docService = inject(DocumentService);
  private tracker = inject(BehaviorTrackerService);

  // ── System metrics ──────────────────────────────────────────────────────────
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

  // ── Security monitor ────────────────────────────────────────────────────────
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

  ngOnInit() {
    this.refreshData();
    this.patterns.set(this.tracker.getPatterns());
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
