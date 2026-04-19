import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { finalize } from 'rxjs';

interface LeaderEntry {
  id: string;
  username: string;
  title: string | null;
  thumbnailUrl: string | null;
  isLive: boolean;
  viewerCount: number;
  categorySlug: string | null;
  categoryName: string | null;
  followerCount?: number;
  totalViews?: number;
}

@Component({
  selector: 'mado-leaderboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="lb">
      <div class="lb-head">
        <h1 class="lb-title">Leaderboard</h1>
        <div class="tabs">
          <button type="button" [class.on]="metric === 'views'" (click)="setMetric('views')">Top by views</button>
          <button type="button" [class.on]="metric === 'followers'" (click)="setMetric('followers')">Top by followers</button>
        </div>
      </div>

      @if (loading) {
        <div class="sk-list">
          @for (i of skeleton; track i) {
            <div class="sk-row">
              <div class="sk-rank"></div>
              <div class="sk-thumb"></div>
              <div class="sk-info">
                <div class="sk-line sk-w1"></div>
                <div class="sk-line sk-w2"></div>
              </div>
            </div>
          }
        </div>
      } @else if (channels.length === 0) {
        <p class="empty">No channels yet.</p>
      } @else {
        <ol class="lb-list">
          @for (ch of channels; track ch.id; let idx = $index) {
            <li class="lb-row" [class.top3]="idx < 3">
              <span class="rank" [class.gold]="idx === 0" [class.silver]="idx === 1" [class.bronze]="idx === 2">
                {{ idx + 1 }}
              </span>
              <a [routerLink]="['/', ch.username]" class="thumb-link">
                @if (ch.thumbnailUrl) {
                  <img [src]="ch.thumbnailUrl" [alt]="ch.username" class="thumb" />
                } @else {
                  <div class="thumb ph">{{ ch.username.charAt(0).toUpperCase() }}</div>
                }
                @if (ch.isLive) {
                  <span class="live-dot"></span>
                }
              </a>
              <div class="lb-info">
                <a [routerLink]="['/', ch.username]" class="lb-name">{{ ch.username }}</a>
                @if (ch.title) {
                  <span class="lb-title-sub">{{ ch.title }}</span>
                }
                @if (ch.categoryName) {
                  <span class="lb-cat">{{ ch.categoryName }}</span>
                }
              </div>
              <div class="lb-stats">
                @if (metric === 'views') {
                  <span class="stat-value">{{ fmt(ch.totalViews ?? ch.viewerCount) }}</span>
                  <span class="stat-label">total views</span>
                } @else {
                  <span class="stat-value">{{ fmt(ch.followerCount ?? 0) }}</span>
                  <span class="stat-label">followers</span>
                }
                @if (ch.isLive) {
                  <span class="viewers-live">{{ fmt(ch.viewerCount) }} watching</span>
                }
              </div>
            </li>
          }
        </ol>
      }
    </div>
  `,
  styles: [`
    .lb {
      max-width: 860px;
      margin: 0 auto;
      padding: 1.5rem 1rem;
    }
    .lb-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    .lb-title {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 900;
      color: var(--text-primary);
    }
    .tabs {
      display: flex;
      gap: .5rem;
    }
    .tabs button {
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      color: var(--text-secondary);
      padding: .38rem 1rem;
      border-radius: 999px;
      cursor: pointer;
      font-weight: 700;
      font-family: inherit;
      font-size: .85rem;
      transition: border-color .15s, color .15s;
    }
    .tabs button.on { border-color: var(--accent); color: var(--accent); }
    .sk-list { display: flex; flex-direction: column; gap: .75rem; }
    .sk-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      animation: pulse 1.2s ease-in-out infinite;
    }
    .sk-rank { width: 32px; height: 32px; border-radius: 50%; background: var(--bg-tertiary); flex-shrink: 0; }
    .sk-thumb { width: 56px; height: 56px; border-radius: 8px; background: var(--bg-tertiary); flex-shrink: 0; }
    .sk-info { flex: 1; display: flex; flex-direction: column; gap: .4rem; }
    .sk-line { height: 10px; border-radius: 4px; background: var(--bg-tertiary); }
    .sk-w1 { width: 45%; }
    .sk-w2 { width: 30%; }
    @keyframes pulse { 0%, 100% { opacity: .7; } 50% { opacity: 1; } }
    .empty { color: var(--text-muted); text-align: center; padding: 2rem; }
    .lb-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: .5rem;
    }
    .lb-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: .85rem 1.1rem;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      transition: border-color .15s;
    }
    .lb-row:hover { border-color: rgba(83,252,24,.25); }
    .lb-row.top3 { border-color: rgba(83,252,24,.15); }
    .rank {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--bg-tertiary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: .85rem;
      flex-shrink: 0;
      color: var(--text-muted);
    }
    .rank.gold { background: rgba(255,215,0,.15); color: #ffd700; border: 1px solid #ffd700; }
    .rank.silver { background: rgba(192,192,192,.12); color: #c0c0c0; border: 1px solid #c0c0c0; }
    .rank.bronze { background: rgba(205,127,50,.12); color: #cd7f32; border: 1px solid #cd7f32; }
    .thumb-link { position: relative; flex-shrink: 0; text-decoration: none; }
    .thumb {
      width: 56px;
      height: 56px;
      border-radius: 10px;
      object-fit: cover;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ph {
      background: var(--bg-tertiary);
      font-weight: 900;
      font-size: 1.25rem;
      color: var(--accent);
    }
    .live-dot {
      position: absolute;
      top: -3px;
      right: -3px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 6px var(--accent);
      border: 2px solid var(--bg-card);
    }
    .lb-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: .15rem;
    }
    .lb-name {
      font-weight: 800;
      font-size: .97rem;
      color: var(--text-primary);
      text-decoration: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .lb-name:hover { color: var(--accent); }
    .lb-title-sub {
      font-size: .82rem;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .lb-cat {
      font-size: .75rem;
      color: var(--text-muted);
      text-transform: capitalize;
    }
    .lb-stats {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: .15rem;
      flex-shrink: 0;
    }
    .stat-value { font-size: 1.05rem; font-weight: 900; color: var(--text-primary); }
    .stat-label { font-size: .7rem; color: var(--text-muted); }
    .viewers-live {
      font-size: .72rem;
      font-weight: 700;
      color: var(--accent);
      background: rgba(83,252,24,.1);
      padding: .1rem .4rem;
      border-radius: 4px;
    }
  `]
})
export class LeaderboardComponent implements OnInit {
  readonly skeleton = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  channels: LeaderEntry[] = [];
  metric: 'views' | 'followers' = 'views';
  loading = false;

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.load();
  }

  setMetric(m: 'views' | 'followers'): void {
    if (this.metric === m) return;
    this.metric = m;
    this.load();
  }

  private load(): void {
    this.loading = true;
    const params = new HttpParams().set('metric', this.metric).set('size', '50');
    this.http.get<{ content: LeaderEntry[] }>('/api/channels/leaderboard', { params })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (r) => (this.channels = r.content ?? []),
        error: () => (this.channels = [])
      });
  }

  fmt(n: number): string {
    if (!n) return '0';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  }
}
