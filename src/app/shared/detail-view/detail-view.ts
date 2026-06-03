import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { taskService } from '../../services/task-service';
import { DocumentService } from '../../services/document-service';
import { DepartmentService } from '../../services/department-Service';
import { DocumentVaultService, VaultEntry } from '../../services/document-vault.service';

@Component({
  selector: 'app-detail-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail-view.html',
})
export class DetailViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private taskSvc = inject(taskService);
  private docSvc = inject(DocumentService);
  private deptSvc = inject(DepartmentService);
  private vault = inject(DocumentVaultService);
  private sanitizer = inject(DomSanitizer);

  protected type = signal<string>('');
  protected entity = signal<any>(null);
  protected loading = signal(true);

  protected file = signal<VaultEntry | null>(null);
  protected fileMode = signal<'text' | 'image' | 'pdf' | 'other' | 'none'>('none');
  protected textContent = signal<string>('');
  protected imageUrl = signal<string>('');
  protected pdfUrl = signal<SafeResourceUrl | null>(null);

  ngOnInit(): void {
    const type = this.route.snapshot.paramMap.get('type') ?? '';
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.type.set(type);

    const cached = history.state?.entity;
    if (cached && cached.id === id) {
      this.apply(type, cached);
    } else {
      const obs =
        type === 'task' ? this.taskSvc.getTasks() :
        type === 'document' ? this.docSvc.getDocuments() :
        this.deptSvc.getDepartments();
      obs.subscribe({
        next: (list: any[]) => this.apply(type, list.find(x => x.id === id) ?? null),
        error: () => { this.entity.set(null); this.loading.set(false); },
      });
    }
  }

  private apply(type: string, e: any): void {
    this.entity.set(e);
    this.loading.set(false);
    if (type === 'document' && e) this.loadFile(e.id);
  }

  private async loadFile(id: number): Promise<void> {
    const v = this.vault.get(id);
    this.file.set(v);
    if (!v?.dataUrl) { this.fileMode.set('none'); return; }
    const name = (v.fileName || '').toLowerCase();
    const ft = v.fileType || '';
    if (ft.startsWith('image/')) {
      this.imageUrl.set(v.dataUrl); this.fileMode.set('image');
    } else if (ft === 'application/pdf' || name.endsWith('.pdf')) {
      this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(v.dataUrl)); this.fileMode.set('pdf');
    } else if (ft.startsWith('text/') || /\.(txt|md|csv|json|log|xml|html?|js|ts|css)$/.test(name)) {
      try { this.textContent.set(await (await fetch(v.dataUrl)).text()); this.fileMode.set('text'); }
      catch { this.fileMode.set('other'); }
    } else {
      this.fileMode.set('other');
    }
  }

  protected back(): void { this.location.back(); }

  protected download(): void {
    const f = this.file();
    if (!f?.dataUrl) return;
    const a = document.createElement('a');
    a.href = f.dataUrl; a.download = f.fileName || 'document'; a.click();
  }

  protected prettySize(bytes?: number): string {
    if (!bytes) return '';
    return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  /** Field rows to display for the current entity type. */
  protected fields(): { label: string; value: any }[] {
    const e = this.entity();
    if (!e) return [];
    if (this.type() === 'task') return [
      { label: 'Description', value: e.description },
      { label: 'Due date', value: e.dueDate },
      { label: 'Department', value: e.departmentId ? '#' + e.departmentId : '—' },
      { label: 'Creator', value: e.creatorId ?? '—' },
    ];
    if (this.type() === 'document') return [
      { label: 'Description', value: e.description },
      { label: 'Upload date', value: e.uploadDate },
      { label: 'Associated task', value: e.taskId ? '#' + e.taskId : '—' },
    ];
    return [{ label: 'Identifier', value: '#' + e.id }];
  }

  protected typeLabel(): string {
    return this.type().charAt(0).toUpperCase() + this.type().slice(1);
  }
}
