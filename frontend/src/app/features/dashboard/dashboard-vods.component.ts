import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../core/services/auth.service';

interface VodRow {
  id: string;
  title: string;
  vodUrl: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
  viewCount: number;
  isPublic: boolean;
  expiresAt: string | null;
  createdAt: string;
}

@Component({
  selector: 'mado-dashboard-vods',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
    <div class="page">
      <h1 class="mado-heading">VODs</h1>
      <p class="hint">Past stream recordings. VODs expire 30 days after the stream.</p>

      @if (loading) {
        <p class="muted">Loading VODs…</p>
      } @else if (vods.length === 0) {
        <p class="muted empty">No VODs yet. Start streaming to generate recordings.</p>
      } @else {
        <div class="list">
          @for (vod of vods; track vod.id) {
            <div class="vod-row mado-card">
              <div class="thumb-wrap">
                @if (vod.thumbnailUrl) {
                  <img [src]="vod.thumbnailUrl" [alt]="vod.title" class="thumb" />
                } @else {
                  <div class="thumb placeholder">📹</div>
                }
                <span class="dur">{{ fmtDur(vod.durationSeconds) }}</span>
              </div>
              <div class="vod-info">
                @if (editingId === vod.id) {
                  <input [(ngModel)]="editTitle" class="title-input" (keydown.enter)="saveTitle(vod)" (keydown.escape)="editingId = null" />
                  <div class="edit-btns">
                    <button class="btn small" (click)="saveTitle(vod)">Save</button>
                    <button class="btn small secondary" (click)="editingId = null">Cancel</button>
                  </div>
                } @else {
                  <span class="vod-title" (click)="startEdit(vod)">{{ vod.title }} ✎</span>
                }
                <div class="meta">
                  <span>{{ vod.viewCount }} views</span>
                  <span>{{ vod.createdAt | date:'mediumDate' }}</span>
                  @if (vod.expiresAt) {
                    <span class="expires">Expires {{ vod.expiresAt | date:'mediumDate' }}</span>
                  }
                </div>
              </div>
              <div class="vod-actions">
                <label class="toggle-label">
                  <input type="checkbox" [checked]="vod.isPublic" (change)="togglePublic(vod)" />
                  Public
                </label>
                <a [href]="vod.vodUrl" target="_blank" class="btn secondary">Watch</a>
                <button class="btn danger" (click)="deleteVod(vod.id)">Delete</button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 960px; margin: 0 auto; padding: 1rem 1rem 3rem; }
    h1 { color: var(--accent); font-size: 2rem; margin: 0 0 .5rem; }
    .hint { color: var(--text-muted); font-size: .85rem; margin-bottom: 1.25rem; }
    .muted { color: var(--text-muted); }
    .empty { text-align: center; padding: 3rem; }
    .list { display: flex; flex-direction: column; gap: .75rem; }
    .vod-row { display: flex; gap: 1rem; align-items: center; padding: .75rem 1rem; flex-wrap: wrap; }
    .thumb-wrap { position: relative; width: 160px; aspect-ratio: 16/9; flex-shrink: 0; background: var(--bg-tertiary); border-radius: 8px; overflow: hidden; }
    .thumb { width: 100%; height: 100%; object-fit: cover; }
    .placeholder { display: flex; align-items: center; justify-content: center; font-size: 2rem; height: 100%; }
    .dur { position: absolute; bottom: 4px; right: 6px; background: rgba(0,0,0,.75); color: #fff; font-size: .72rem; padding: 1px 5px; border-radius: 4px; }
    .vod-info { flex: 1; min-width: 160px; }
    .vod-title { font-weight: 700; cursor: pointer; }
    .vod-title:hover { color: var(--accent); }
    .title-input { background: var(--bg-tertiary); border: 1px solid var(--accent); border-radius: 8px; color: var(--text-primary); padding: .4rem .6rem; width: 100%; margin-bottom: .35rem; }
    .edit-btns { display: flex; gap: .4rem; }
    .meta { display: flex; flex-wrap: wrap; gap: .75rem; font-size: .78rem; color: var(--text-muted); margin-top: .35rem; }
    .expires { color: var(--warning); }
    .vod-actions { display: flex; align-items: center; gap: .6rem; flex-wrap: wrap; }
    .toggle-label { display: flex; align-items: center; gap: .35rem; font-size: .85rem; cursor: pointer; }
    .btn { border: none; border-radius: 8px; padding: .4rem .8rem; font-size: .82rem; font-weight: 700; cursor: pointer; font-family: inherit; background: var(--accent); color: #000; }
    .btn.secondary { background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border); }
    .btn.danger { background: transparent; color: var(--danger); border: 1px solid var(--danger); }
    .btn.small { padding: .25rem .6rem; font-size: .78rem; }
  `]
})
export class DashboardVodsComponent implements OnInit {
  vods: VodRow[] = [];
  loading = true;
  editingId: string | null = null;
  editTitle = '';

  constructor(
    private readonly auth: AuthService,
    private readonly http: HttpClient,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const u = this.auth.currentUser$.value;
    if (!u) return;
    this.http.get<{ content: VodRow[] }>('/api/dashboard/vods?page=0&size=50').subscribe({
      next: (p) => { this.vods = p.content ?? []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  startEdit(vod: VodRow): void {
    this.editingId = vod.id;
    this.editTitle = vod.title;
  }

  saveTitle(vod: VodRow): void {
    const u = this.auth.currentUser$.value;
    if (!u) return;
    this.http.patch(`/api/channels/${u.username}/vods/${vod.id}`, { title: this.editTitle }).subscribe({
      next: () => {
        vod.title = this.editTitle;
        this.editingId = null;
        this.toastr.success('Title updated');
      },
      error: () => this.toastr.error('Could not update title')
    });
  }

  togglePublic(vod: VodRow): void {
    const u = this.auth.currentUser$.value;
    if (!u) return;
    const newVal = !vod.isPublic;
    this.http.patch(`/api/channels/${u.username}/vods/${vod.id}`, { isPublic: newVal }).subscribe({
      next: () => { vod.isPublic = newVal; },
      error: () => this.toastr.error('Could not update visibility')
    });
  }

  deleteVod(id: string): void {
    const u = this.auth.currentUser$.value;
    if (!u || !confirm('Delete this VOD?')) return;
    this.http.delete(`/api/channels/${u.username}/vods/${id}`).subscribe({
      next: () => {
        this.vods = this.vods.filter(v => v.id !== id);
        this.toastr.success('VOD deleted');
      },
      error: () => this.toastr.error('Could not delete VOD')
    });
  }

  fmtDur(secs: number): string {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;
  }
}
