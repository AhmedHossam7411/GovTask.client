import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { taskService } from '../services/task-service';
import { DocumentService } from '../services/document-service';
import { DepartmentService } from '../services/department-Service';
import { taskDto } from '../tasks/taskDto';
import { documentDto } from '../document-component/documentDto';

/**
 * View-only analytics dashboard. Every figure is derived live from the real
 * Task / Document / Department data (auto-refreshed). No mock data.
 */
@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css',
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  private taskSvc = inject(taskService);
  private docSvc = inject(DocumentService);
  private deptSvc = inject(DepartmentService);
  private poll: ReturnType<typeof setInterval> | null = null;

  protected loading = signal(true);
  protected error = signal(false);
  protected updatedAt = signal<Date | null>(null);
  protected tasks = signal<taskDto[]>([]);
  protected documents = signal<documentDto[]>([]);
  protected departments = signal<{ id: number; name: string }[]>([]);

  ngOnInit(): void {
    this.load(true);
    this.poll = setInterval(() => this.load(false), 20_000); // live refresh
  }
  ngOnDestroy(): void {
    if (this.poll) clearInterval(this.poll);
  }

  load(showSpinner: boolean): void {
    if (showSpinner) this.loading.set(true);
    forkJoin({
      tasks: this.taskSvc.getTasks(),
      docs: this.docSvc.getDocuments(),
      depts: this.deptSvc.getDepartments() as any,
    }).subscribe({
      next: ({ tasks, docs, depts }) => {
        this.tasks.set(tasks ?? []);
        this.documents.set(docs ?? []);
        this.departments.set((depts as any) ?? []);
        this.updatedAt.set(new Date());
        this.error.set(false);
        this.loading.set(false);
      },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }

  private daysUntil(d?: string): number | null {
    if (!d) return null;
    const due = new Date(d).getTime();
    if (isNaN(due)) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.ceil((due - today.getTime()) / 86_400_000);
  }

  // ── KPI cards (real) ───────────────────────────────────────────────────
  protected overdue = computed(() =>
    this.tasks().filter(t => { const n = this.daysUntil(t.dueDate); return n !== null && n < 0; }).length);

  protected kpis = computed(() => [
    { label: 'Total Tasks',  value: this.tasks().length,        bar: 'bg-sage-500' },
    { label: 'Documents',    value: this.documents().length,    bar: 'bg-bronze-500' },
    { label: 'Departments',  value: this.departments().length,  bar: 'bg-ink-400' },
    { label: 'Overdue',      value: this.overdue(),             bar: 'bg-red-500' },
  ]);
  protected kpiMax = computed(() => Math.max(1, ...this.kpis().map(k => k.value)));

  // ── Task status donut (real, derived from due dates) ───────────────────
  protected statusData = computed(() => {
    let overdue = 0, week = 0, upcoming = 0, none = 0;
    for (const t of this.tasks()) {
      const n = this.daysUntil(t.dueDate);
      if (n === null) none++;
      else if (n < 0) overdue++;
      else if (n <= 7) week++;
      else upcoming++;
    }
    return [
      { label: 'Overdue',       value: overdue,  color: '#b45151' },
      { label: 'Due this week', value: week,     color: '#a98c5f' },
      { label: 'Upcoming',      value: upcoming, color: '#6f8360' },
      { label: 'No due date',   value: none,     color: '#9a9384' },
    ].filter(s => s.value > 0);
  });
  protected statusTotal = computed(() => this.statusData().reduce((a, b) => a + b.value, 0));
  protected donutSingle = computed(() => this.statusData().length === 1 ? this.statusData()[0] : null);
  protected donutArcs = computed(() => {
    const data = this.statusData(); const total = this.statusTotal() || 1;
    const cx = 90, cy = 90, r = 70; let a = -Math.PI / 2;
    return data.map(s => {
      const frac = s.value / total;
      const a0 = a, a1 = a + frac * 2 * Math.PI; a = a1;
      const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      const large = (a1 - a0) > Math.PI ? 1 : 0;
      return { ...s, pct: Math.round(frac * 100), d: `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}` };
    });
  });

  // ── Tasks by due month (real time-series, bars) ────────────────────────
  protected tasksByMonth = computed(() => this.bucketByMonth(this.tasks().map(t => t.dueDate)));
  protected tasksByMonthMax = computed(() => Math.max(1, ...this.tasksByMonth().map(m => m.count)));

  // ── Documents by upload month (real, bars) ─────────────────────────────
  protected docsByMonth = computed(() => this.bucketByMonth(this.documents().map(d => d.uploadDate)));
  protected docsByMonthMax = computed(() => Math.max(1, ...this.docsByMonth().map(m => m.count)));

  private bucketByMonth(dates: (string | undefined)[]) {
    const map = new Map<string, { key: string; label: string; count: number }>();
    for (const ds of dates) {
      if (!ds) continue;
      const dt = new Date(ds); if (isNaN(dt.getTime())) continue;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      const label = dt.toLocaleString('en', { month: 'short', year: '2-digit' });
      const e = map.get(key) ?? { key, label, count: 0 };
      e.count++; map.set(key, e);
    }
    return [...map.values()].sort((a, b) => a.key.localeCompare(b.key)).slice(-8);
  }

  // ── Workload by department (real join) ─────────────────────────────────
  protected deptWorkload = computed(() => {
    const counts = new Map<number, number>();
    for (const t of this.tasks()) if (t.departmentId != null) counts.set(t.departmentId, (counts.get(t.departmentId) || 0) + 1);
    const palette = ['#6f8360', '#a98c5f', '#899c78', '#c2a578', '#58694b', '#9a9384'];
    return this.departments()
      .map((d, i) => ({ name: d.name, count: counts.get(d.id) || 0, color: palette[i % palette.length] }))
      .sort((a, b) => b.count - a.count);
  });
  protected deptMax = computed(() => Math.max(1, ...this.deptWorkload().map(d => d.count)));

  // ── Top creators (real, by creatorId) ──────────────────────────────────
  protected topCreators = computed(() => {
    const counts = new Map<string, number>();
    for (const t of this.tasks()) {
      const c = (t as any).creatorId;
      const key = (c == null || c === '') ? 'Unknown' : String(c);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return [...counts.entries()]
      .map(([id, count]) => ({
        id,
        count,
        label: id === 'Unknown' ? 'Unknown' : id.slice(0, 8),
        initials: id === 'Unknown' ? 'U' : id.slice(0, 2).toUpperCase(),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  });
  protected creatorMax = computed(() => Math.max(1, ...this.topCreators().map(c => c.count)));
}
