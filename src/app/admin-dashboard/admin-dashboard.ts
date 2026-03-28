import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DepartmentService } from '../services/department-Service';
import { taskService } from '../services/task-service';
import { DocumentService } from '../services/document-service';
import { forkJoin } from 'rxjs';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit {
  private deptService = inject(DepartmentService);
  private taskService = inject(taskService);
  private docService = inject(DocumentService);

  // State Signals
  protected departments = signal<any[]>([]);
  protected tasks = signal<any[]>([]);
  protected documents = signal<any[]>([]);
  protected isLoading = signal(true);
  protected errorMessage = signal('');

  // Computed Stats
  protected totalDepts = computed(() => this.departments().length);
  protected totalTasks = computed(() => this.tasks().length);
  protected totalDocs = computed(() => this.documents().length);

  // Recent Activity Feed
  protected recentActivity = computed(() => {
    const all = [
      ...this.departments().map(d => ({ ...d, type: 'Department', icon: 'building' })),
      ...this.tasks().map(t => ({ ...t, type: 'Task', icon: 'clipboard-list' })),
      ...this.documents().map(doc => ({ ...doc, type: 'Document', icon: 'file-text' }))
    ];
    // Sort by "id" as a proxy for recency if no timestamps are available, descending
    return all.sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 6);
  });

  // Chart Data (Task distribution by department)
  protected taskDistribution = computed(() => {
    const dist: { name: string, count: number, color: string }[] = [];
    const depts = this.departments();
    const tasks = this.tasks();

    depts.forEach((dept, index) => {
      const count = tasks.filter(t => t.departmentId === dept.id).length;
      if (count > 0) {
        dist.push({
          name: dept.name,
          count: count,
          color: this.getColor(index)
        });
      }
    });
    return dist;
  });

  ngOnInit() {
    this.refreshData();
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

  private getColor(index: number): string {
    const colors = ['#84cc16', '#06b6d4', '#8b5cf6', '#f43f5e', '#f59e0b', '#10b981'];
    return colors[index % colors.length];
  }
}
