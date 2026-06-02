import { Component, HostListener, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { SpringPage } from '../../core/models/spring-page';

interface ClipRow {
  id: string;
  title: string;
  clipUrl: string;
  channelUsername: string;
  viewCount: number;
  likeCount: number;
  thumbnailUrl: string | null;
}

@Component({
  selector: 'mado-clips',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="mado-heading">Clips</h1>
      <p class="lead">Community highlights</p>
      <div class="grid">
        @for (c of clips; track c.id) {
          <div class="card mado-card" (click)="open(c)">
            @if (c.thumbnailUrl) {
              <img [src]="c.thumbnailUrl" [alt]="c.title" />
            } @else {
              <div class="ph"><span class="ph-icon">▶</span></div>
            }
            <div class="body">
              <strong>{{ c.title }}</strong>
              <span>{{ c.channelUsername }} · {{ c.viewCount }} views · {{ c.likeCount ?? 0 }} likes</span>
            </div>
          </div>
        }
      </div>

      @if (loading && clips.length === 0) {
        <p class="loading-msg">Loading clips…</p>
      }
    </div>

    @if (selected) {
      <div class="modal-backdrop" (click)="close()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <div class="modal-title">{{ selected.title }}</div>
            <button class="close-btn" (click)="close()">✕</button>
          </div>
          <video class="clip-video" [src]="selected.clipUrl" autoplay controls
                 (error)="videoError = true"></video>
          @if (videoError) {
            <div class="video-unavail">⚠️ Video not available — media server may be offline.</div>
          }
          <div class="modal-meta">
            <a class="channel-link" [routerLink]="['/', selected.channelUsername]" (click)="close()">{{ selected.channelUsername }}</a>
            <span class="views">{{ selected.viewCount }} views</span>
            <button class="like-btn" (click)="like(selected!)" [disabled]="liking">
              ♥ {{ selected.likeCount ?? 0 }}
            </button>
          </div>
          <div class="nav-btns">
            <button class="nav-btn" (click)="prev()" [disabled]="currentIdx === 0">‹ Prev</button>
            <button class="nav-btn" (click)="next()" [disabled]="currentIdx >= clips.length - 1">Next ›</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page { max-width: 1200px; margin: 2rem auto; padding: 1rem 1rem 3rem; }
    h1 { color: var(--accent); font-size: 2.25rem; margin: 0 0 .25rem; }
    .lead { color: var(--text-secondary); margin-bottom: 1.5rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
    .card {
      display: flex; flex-direction: column; cursor: pointer;
      transition: transform .15s, box-shadow .15s;
    }
    .card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.4); }
    img, .ph {
      width: 100%; aspect-ratio: 16/9; object-fit: cover; background: var(--bg-tertiary);
    }
    .ph { display: flex; align-items: center; justify-content: center; }
    .ph-icon { font-size: 2rem; opacity: .3; }
    .body { padding: .85rem 1rem; display: flex; flex-direction: column; gap: .35rem; }
    .body span { font-size: .85rem; color: var(--text-secondary); }
    .loading-msg { text-align: center; color: var(--text-muted); padding: 2rem; }
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,.88); z-index: 500;
      display: flex; align-items: center; justify-content: center;
    }
    .modal {
      background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px;
      width: min(860px, 95vw); max-height: 95vh; overflow: auto;
      box-shadow: 0 24px 80px rgba(0,0,0,.6);
    }
    .modal-head {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1rem 1.25rem; border-bottom: 1px solid var(--border);
    }
    .modal-title { font-weight: 800; font-size: 1.05rem; }
    .close-btn {
      background: none; border: none; color: var(--text-muted); font-size: 1.1rem;
      cursor: pointer; padding: .25rem .5rem; border-radius: 6px;
    }
    .close-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
    .clip-video { width: 100%; aspect-ratio: 16/9; background: #000; display: block; }
    .video-unavail { background: rgba(255,152,0,.12); color: #ff9800; text-align: center; padding: .75rem; font-size: .9rem; }
    .modal-meta {
      display: flex; gap: 1rem; align-items: center; padding: .75rem 1.25rem;
      border-bottom: 1px solid var(--border);
    }
    .channel-link { font-weight: 700; color: var(--accent); }
    .views { color: var(--text-secondary); font-size: .9rem; }
    .like-btn {
      margin-left: auto; background: transparent; border: 1px solid var(--border); color: var(--text-primary);
      font-weight: 700; padding: .3rem .75rem; border-radius: 8px; cursor: pointer; font-family: inherit;
    }
    .like-btn:hover:not(:disabled) { border-color: #e53935; color: #e53935; }
    .like-btn:disabled { opacity: .5; }
    .nav-btns { display: flex; justify-content: space-between; padding: .75rem 1.25rem; }
    .nav-btn {
      background: var(--bg-tertiary); border: 1px solid var(--border); color: var(--text-secondary);
      padding: .4rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 700; font-family: inherit;
    }
    .nav-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
    .nav-btn:disabled { opacity: .4; cursor: default; }
  `]
})
export class ClipsComponent implements OnInit {
  clips: ClipRow[] = [];
  selected: ClipRow | null = null;
  currentIdx = 0;
  loading = true;
  liking = false;
  videoError = false;

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.http
      .get<SpringPage<ClipRow>>('/api/clips', { params: { page: '0', size: '48' } })
      .subscribe({ next: p => { this.clips = p.content ?? []; this.loading = false; }, error: () => { this.loading = false; } });
  }

  open(clip: ClipRow): void {
    this.currentIdx = this.clips.indexOf(clip);
    this.selected = clip;
    this.videoError = false;
  }

  close(): void { this.selected = null; this.videoError = false; }

  prev(): void {
    if (this.currentIdx > 0) { this.currentIdx--; this.selected = this.clips[this.currentIdx]; this.videoError = false; }
  }

  next(): void {
    if (this.currentIdx < this.clips.length - 1) { this.currentIdx++; this.selected = this.clips[this.currentIdx]; this.videoError = false; }
  }

  like(clip: ClipRow): void {
    this.liking = true;
    this.http.post<{ likeCount: number }>(`/api/clips/${clip.id}/like`, {}).subscribe({
      next: r => {
        clip.likeCount = r.likeCount;
        if (this.selected?.id === clip.id) this.selected = { ...clip };
        this.liking = false;
      },
      error: () => { this.liking = false; }
    });
  }

  @HostListener('document:keydown.escape')
  onEsc(): void { this.close(); }
}
