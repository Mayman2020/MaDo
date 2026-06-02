import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../core/services/auth.service';

interface ClipRow {
  id: string;
  title: string;
  clipUrl: string;
  thumbnailUrl: string | null;
  viewCount: number;
  durationSeconds: number;
  isFeatured: boolean;
  createdAt: string;
}

@Component({
  selector: 'mado-dashboard-clips',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="page">
      <h1 class="mado-heading">Clips</h1>

      @if (loading) {
        <p class="muted">Loading clips…</p>
      } @else if (clips.length === 0) {
        <p class="muted empty">No clips yet. Clips are created by viewers or from the channel page.</p>
      } @else {
        <div class="grid">
          @for (clip of clips; track clip.id) {
            <div class="clip-card mado-card">
              <div class="thumb-wrap">
                @if (clip.thumbnailUrl) {
                  <img [src]="clip.thumbnailUrl" [alt]="clip.title" class="thumb" />
                } @else {
                  <div class="thumb placeholder">🎬</div>
                }
                <span class="dur">{{ fmtDur(clip.durationSeconds) }}</span>
              </div>
              <div class="info">
                <span class="title" [title]="clip.title">{{ clip.title }}</span>
                <div class="meta">
                  <span>{{ clip.viewCount }} views</span>
                  <span>{{ clip.createdAt | date:'mediumDate' }}</span>
                </div>
              </div>
              <div class="actions">
                <a [href]="clip.clipUrl" target="_blank" class="btn secondary">Watch</a>
                <button type="button" class="btn danger" (click)="delete(clip.id)">Delete</button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 960px; margin: 0 auto; padding: 1rem 1rem 3rem; }
    h1 { color: var(--accent); font-size: 2rem; margin: 0 0 1.25rem; }
    .muted { color: var(--text-muted); }
    .empty { text-align: center; padding: 3rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
    .clip-card { padding: 0; overflow: hidden; display: flex; flex-direction: column; }
    .thumb-wrap { position: relative; aspect-ratio: 16/9; background: var(--bg-tertiary); }
    .thumb { width: 100%; height: 100%; object-fit: cover; display: block; }
    .placeholder { display: flex; align-items: center; justify-content: center; font-size: 2rem; height: 100%; }
    .dur { position: absolute; bottom: 4px; right: 6px; background: rgba(0,0,0,.75); color: #fff; font-size: .75rem; padding: 1px 5px; border-radius: 4px; }
    .info { padding: .75rem; flex: 1; }
    .title { font-weight: 700; font-size: .9rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .meta { display: flex; gap: .75rem; font-size: .78rem; color: var(--text-muted); margin-top: .35rem; }
    .actions { padding: .5rem .75rem .75rem; display: flex; gap: .5rem; }
    .btn { border: none; border-radius: 8px; padding: .35rem .75rem; font-size: .82rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    .btn.secondary { background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border); }
    .btn.danger { background: transparent; color: var(--danger); border: 1px solid var(--danger); }
  `]
})
export class DashboardClipsComponent implements OnInit {
  clips: ClipRow[] = [];
  loading = true;

  constructor(
    private readonly auth: AuthService,
    private readonly http: HttpClient,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const u = this.auth.currentUser$.value;
    if (!u) return;
    this.http.get<{ content: ClipRow[] }>(`/api/channels/${u.username}/clips?page=0&size=50`).subscribe({
      next: (p) => { this.clips = p.content ?? []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  delete(id: string): void {
    if (!confirm('Delete this clip?')) return;
    this.http.delete(`/api/clips/${id}`).subscribe({
      next: () => {
        this.clips = this.clips.filter(c => c.id !== id);
        this.toastr.success('Clip deleted');
      },
      error: () => this.toastr.error('Could not delete clip')
    });
  }

  fmtDur(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
}
