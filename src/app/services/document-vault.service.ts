import { Injectable } from '@angular/core';

export interface VaultEntry {
  fileName?: string;
  fileType?: string;
  size?: number;
  dataUrl?: string;
  status: string;
  history: { status: string; at: string }[];
}

export interface FilePayload {
  fileName: string;
  fileType: string;
  size: number;
  dataUrl: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class DocumentVaultService {
  private readonly KEY = 'doc-vault-v1';

  readonly MAX_BYTES = 1.5 * 1024 * 1024;
  readonly STATUSES = ['Uploaded', 'In Review', 'Approved', 'Archived'];

  private read(): Record<string, VaultEntry> {
    try { return JSON.parse(localStorage.getItem(this.KEY) || '{}'); } catch { return {}; }
  }
  private write(v: Record<string, VaultEntry>): void {
    try { localStorage.setItem(this.KEY, JSON.stringify(v)); }
    catch { console.warn('Document vault is full — file not stored locally.'); }
  }

  get(id: number | string): VaultEntry | null {
    return this.read()[String(id)] ?? null;
  }

  save(id: number | string, entry: Omit<VaultEntry, 'history'> & { history?: VaultEntry['history'] }): void {
    const v = this.read();
    v[String(id)] = {
      ...entry,
      history: entry.history ?? [{ status: entry.status, at: new Date().toISOString() }],
    };
    this.write(v);
  }

  advanceStatus(id: number | string): string {
    const v = this.read();
    const e = v[String(id)] ?? { status: this.STATUSES[0], history: [] };
    const next = this.STATUSES[(this.STATUSES.indexOf(e.status) + 1) % this.STATUSES.length];
    e.status = next;
    e.history = [...(e.history ?? []), { status: next, at: new Date().toISOString() }];
    v[String(id)] = e;
    this.write(v);
    return next;
  }

  readFile(file: File): Promise<FilePayload> {
    return new Promise((resolve, reject) => {
      if (file.size > this.MAX_BYTES) {
        reject(new Error(`File exceeds ${(this.MAX_BYTES / 1024 / 1024).toFixed(1)} MB local limit`));
        return;
      }
      const r = new FileReader();
      r.onload = () => resolve({
        fileName: file.name,
        fileType: file.type || file.name.split('.').pop() || 'file',
        size: file.size,
        dataUrl: String(r.result),
        status: this.STATUSES[0],
      });
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
  }
}
