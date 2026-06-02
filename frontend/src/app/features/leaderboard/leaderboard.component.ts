import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { resolveApiBaseUrl } from '../../../environments/api-url';

interface RankRow {
  rank: number;
  channelId: string;
  username: string;
  title: string | null;
  viewerCount: number;
  metricValue: number;
  categoryName: string | null;
  thumbnailUrl: string | null;
  isLive: boolean;
  followerCount: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

@Component({
  selector: 'mado-leaderboard',
  standalone: true,
  imports: [RouterLink, FormsModule, DecimalPipe, NgTemplateOutlet],
  template: `
    <div class="lb-page">
      <div class="lb-head">
        <h1 class="lb-title">Leaderboard</h1>
        <p class="lb-sub">Rankings across the MaDo platform</p>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button type="button" [class.on]="tab==='live'"     (click)="setTab('live')">🔴 Live Now</button>
        <button type="button" [class.on]="tab==='today'"    (click)="setTab('today')">📅 Today</button>
        <button type="button" [class.on]="tab==='hourly'"   (click)="setTab('hourly')">⏰ By Hour</button>
        <button type="button" [class.on]="tab==='weekly'"   (click)="setTab('weekly')">📊 This Week</button>
        <button type="button" [class.on]="tab==='monthly'"  (click)="setTab('monthly')">📆 This Month</button>
        <button type="button" [class.on]="tab==='alltime'"  (click)="setTab('alltime')">🏆 All Time</button>
        <button type="button" [class.on]="tab==='category'" (click)="setTab('category')">🎮 By Game</button>
        <button type="button" [class.on]="tab==='rising'"   (click)="setTab('rising')">🚀 Rising</button>
      </div>

      <!-- ─── LIVE NOW ─────────────────────────────────── -->
      @if (tab === 'live') {
        <div class="ws-badge">🟢 Powered by live data · updates every 30s</div>
        <div class="table-wrap">
          <table class="lb-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Channel</th>
                <th>Game</th>
                <th>Viewers</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (row of liveRows; track row.channelId) {
                <tr [class.gold]="row.rank===1" [class.silver]="row.rank===2" [class.bronze]="row.rank===3">
                  <td class="rank-cell">
                    @if (row.rank <= 3) {
                      <span class="medal">{{ row.rank===1?'🥇':row.rank===2?'🥈':'🥉' }}</span>
                    } @else {
                      <span class="rank-num">{{ row.rank }}</span>
                    }
                  </td>
                  <td>
                    <a class="channel-cell" [routerLink]="['/'+row.username]">
                      <div class="av-wrap">
                        <img class="avatar" [src]="row.thumbnailUrl || '/assets/default-channel.jpg'" [alt]="row.username" />
                        @if (row.isLive) { <span class="live-dot"></span> }
                      </div>
                      <span class="uname">{{ row.username }}</span>
                    </a>
                  </td>
                  <td><span class="cat-pill">{{ row.categoryName || '—' }}</span></td>
                  <td><strong class="viewers">{{ row.viewerCount | number }}</strong></td>
                  <td>
                    <a [routerLink]="['/'+row.username]" class="watch-btn">Watch</a>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="empty">No live streams right now.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- ─── TODAY ─────────────────────────────────────── -->
      @if (tab === 'today') {
        <div class="filter-row">
          <select [(ngModel)]="selectedCatSlug" (change)="load()">
            <option value="">All categories</option>
            @for (c of categories; track c.id) {
              <option [value]="c.slug">{{ c.name }}</option>
            }
          </select>
          <button type="button" class="refresh-btn" (click)="load()">↺ Refresh</button>
        </div>
        <ng-container *ngTemplateOutlet="genericTable; context: { $implicit: rows, col: 'Views today' }"></ng-container>
      }

      <!-- ─── BY HOUR ────────────────────────────────────── -->
      @if (tab === 'hourly') {
        <div class="filter-row">
          <input type="date" [(ngModel)]="hourlyDate" (change)="load()" />
          <select [(ngModel)]="selectedHour" (change)="load()">
            @for (h of hours24; track h) {
              <option [value]="h">{{ h }}:00</option>
            }
          </select>
        </div>
        <ng-container *ngTemplateOutlet="genericTable; context: { $implicit: rows, col: 'Peak viewers' }"></ng-container>
      }

      <!-- ─── WEEKLY ─────────────────────────────────────── -->
      @if (tab === 'weekly') {
        <ng-container *ngTemplateOutlet="genericTable; context: { $implicit: rows, col: 'Views this week' }"></ng-container>
      }

      <!-- ─── MONTHLY ────────────────────────────────────── -->
      @if (tab === 'monthly') {
        <div class="sub-tabs">
          <button type="button" [class.on]="monthlyMode==='views'"   (click)="monthlyMode='views';load()">By Views</button>
          <button type="button" [class.on]="monthlyMode==='hours'"   (click)="monthlyMode='hours';load()">By Hours</button>
        </div>
        <ng-container *ngTemplateOutlet="genericTable; context: { $implicit: rows, col: monthlyMode==='hours'?'Hours streamed':'Views this month' }"></ng-container>
      }

      <!-- ─── ALL TIME ───────────────────────────────────── -->
      @if (tab === 'alltime') {
        <div class="filter-row">
          <select [(ngModel)]="selectedCatSlug" (change)="load()">
            <option value="">All categories</option>
            @for (c of categories; track c.id) {
              <option [value]="c.slug">{{ c.name }}</option>
            }
          </select>
        </div>
        <ng-container *ngTemplateOutlet="genericTable; context: { $implicit: rows, col: 'All-time views' }"></ng-container>
      }

      <!-- ─── BY CATEGORY ───────────────────────────────── -->
      @if (tab === 'category') {
        <div class="filter-row">
          <select [(ngModel)]="selectedCatSlug" (change)="load()">
            <option value="">Pick a category…</option>
            @for (c of categories; track c.id) {
              <option [value]="c.slug">{{ c.name }}</option>
            }
          </select>
        </div>
        @if (selectedCatSlug) {
          <h2 class="cat-heading">Top {{ catName(selectedCatSlug) }} Streamers</h2>
        }
        <ng-container *ngTemplateOutlet="genericTable; context: { $implicit: rows, col: 'Views today' }"></ng-container>
      }

      <!-- ─── RISING ─────────────────────────────────────── -->
      @if (tab === 'rising') {
        <p class="rising-note">Fastest growing streamers — ranked by % viewer growth vs last week</p>
        <div class="table-wrap">
          <table class="lb-table">
            <thead>
              <tr><th>#</th><th>Channel</th><th>Game</th><th>Growth</th><th>Viewers</th><th></th></tr>
            </thead>
            <tbody>
              @for (row of rows; track row.channelId) {
                <tr>
                  <td class="rank-cell"><span class="rank-num">{{ row.rank }}</span></td>
                  <td>
                    <a class="channel-cell" [routerLink]="['/'+row.username]">
                      <div class="av-wrap">
                        <img class="avatar" [src]="row.thumbnailUrl || '/assets/default-channel.jpg'" [alt]="row.username" />
                        @if (row.isLive) { <span class="live-dot"></span> }
                      </div>
                      <span class="uname">{{ row.username }}</span>
                      @if (isNew(row)) { <span class="new-tag">New!</span> }
                    </a>
                  </td>
                  <td><span class="cat-pill">{{ row.categoryName || '—' }}</span></td>
                  <td><strong class="growth-val">↑ {{ row.metricValue }}%</strong></td>
                  <td>{{ row.viewerCount | number }}</td>
                  <td><a [routerLink]="['/'+row.username]" class="watch-btn">Watch</a></td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="empty">No rising streamers data yet.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Loading -->
      @if (loading) {
        <div class="loading">Loading rankings…</div>
      }
    </div>

    <!-- Shared table template -->
    <ng-template #genericTable let-data let-col="col">
      <div class="table-wrap">
        <table class="lb-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Channel</th>
              <th>Game</th>
              <th>{{ col }}</th>
              <th>Live</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (row of data; track row.channelId) {
              <tr [class.gold]="row.rank===1" [class.silver]="row.rank===2" [class.bronze]="row.rank===3">
                <td class="rank-cell">
                  @if (row.rank <= 3) {
                    <span class="medal">{{ row.rank===1?'🥇':row.rank===2?'🥈':'🥉' }}</span>
                  } @else {
                    <span class="rank-num">{{ row.rank }}</span>
                  }
                </td>
                <td>
                  <a class="channel-cell" [routerLink]="['/'+row.username]">
                    <div class="av-wrap">
                      <img class="avatar" [src]="row.thumbnailUrl || '/assets/default-channel.jpg'" [alt]="row.username" />
                      @if (row.isLive) { <span class="live-dot"></span> }
                    </div>
                    <span class="uname">{{ row.username }}</span>
                  </a>
                </td>
                <td><span class="cat-pill">{{ row.categoryName || '—' }}</span></td>
                <td><strong>{{ row.metricValue | number }}</strong></td>
                <td>
                  @if (row.isLive) {
                    <span class="live-pill-sm">LIVE · {{ row.viewerCount | number }}</span>
                  } @else {
                    <span class="offline-dot">offline</span>
                  }
                </td>
                <td><a [routerLink]="['/'+row.username]" class="watch-btn">Watch</a></td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="empty">No data yet.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </ng-template>
  `,
  styles: [`
    .lb-page { max-width: 1100px; margin: 0 auto; padding: 1.5rem 1rem 4rem; }
    .lb-head { margin-bottom: 1.5rem; }
    .lb-title { font-size: 2rem; font-weight: 900; color: var(--accent); margin: 0 0 .25rem; }
    .lb-sub { color: var(--text-muted); margin: 0; }

    .tabs {
      display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 1.5rem;
    }
    .tabs button {
      background: var(--bg-tertiary); border: 1px solid var(--border);
      color: var(--text-secondary); padding: .45rem 1rem; border-radius: 999px;
      cursor: pointer; font-weight: 700; font-family: inherit; font-size: .88rem;
      transition: all .15s;
    }
    .tabs button.on {
      background: var(--accent); color: #000; border-color: var(--accent);
    }

    .sub-tabs {
      display: flex; gap: .5rem; margin-bottom: 1rem;
    }
    .sub-tabs button {
      background: var(--bg-tertiary); border: 1px solid var(--border);
      color: var(--text-secondary); padding: .35rem .85rem; border-radius: 8px;
      cursor: pointer; font-weight: 700; font-family: inherit; font-size: .84rem;
    }
    .sub-tabs button.on { border-color: var(--accent); color: var(--accent); }

    .ws-badge {
      font-size: .78rem; color: var(--text-muted); margin-bottom: .75rem;
      display: flex; align-items: center; gap: .4rem;
    }

    .filter-row {
      display: flex; gap: .75rem; align-items: center; margin-bottom: 1rem; flex-wrap: wrap;
    }
    .filter-row select, .filter-row input {
      background: var(--bg-tertiary); border: 1px solid var(--border);
      color: var(--text-primary); padding: .45rem .75rem; border-radius: 8px;
      font-family: inherit; font-size: .9rem;
    }
    .refresh-btn {
      background: var(--bg-tertiary); border: 1px solid var(--border);
      color: var(--text-secondary); padding: .45rem .9rem; border-radius: 8px;
      cursor: pointer; font-weight: 700; font-family: inherit;
    }
    .refresh-btn:hover { border-color: var(--accent); color: var(--accent); }

    .table-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid var(--border); }
    .lb-table { width: 100%; border-collapse: collapse; }
    .lb-table thead th {
      background: var(--bg-tertiary); padding: .75rem 1rem; text-align: left;
      font-size: .78rem; text-transform: uppercase; letter-spacing: .06em;
      color: var(--text-muted); font-weight: 700; border-bottom: 1px solid var(--border);
    }
    .lb-table tbody tr {
      border-bottom: 1px solid var(--border); transition: background .1s;
    }
    .lb-table tbody tr:hover { background: rgba(255,255,255,.03); }
    .lb-table tbody tr.gold   { background: rgba(255,215,0,.06); }
    .lb-table tbody tr.silver { background: rgba(192,192,192,.06); }
    .lb-table tbody tr.bronze { background: rgba(205,127,50,.06); }
    .lb-table td { padding: .65rem 1rem; vertical-align: middle; }

    .rank-cell { width: 52px; text-align: center; }
    .rank-num { font-size: .95rem; font-weight: 800; color: var(--text-muted); }
    .medal { font-size: 1.3rem; }

    .channel-cell {
      display: flex; align-items: center; gap: .75rem; text-decoration: none; color: inherit;
    }
    .av-wrap { position: relative; flex-shrink: 0; }
    .avatar {
      width: 40px; height: 40px; border-radius: 50%; object-fit: cover;
      background: var(--bg-tertiary);
    }
    .live-dot {
      position: absolute; bottom: 1px; right: 1px; width: 10px; height: 10px;
      border-radius: 50%; background: #e53935; border: 2px solid var(--bg-secondary);
    }
    .uname { font-weight: 700; font-size: .95rem; }

    .cat-pill {
      background: var(--bg-tertiary); border: 1px solid var(--border);
      border-radius: 6px; padding: .2rem .55rem; font-size: .78rem;
      color: var(--text-muted); white-space: nowrap;
    }
    .viewers { color: var(--accent); font-size: 1.05rem; }
    .growth-val { color: #53fc18; font-size: 1rem; }
    .live-pill-sm {
      background: rgba(229,57,53,.15); color: #e53935; border: 1px solid #e5393540;
      border-radius: 6px; padding: .15rem .45rem; font-size: .75rem; font-weight: 700;
      white-space: nowrap;
    }
    .offline-dot { color: var(--text-muted); font-size: .78rem; }
    .watch-btn {
      background: var(--accent); color: #000; border: none; border-radius: 8px;
      padding: .35rem .85rem; font-weight: 800; font-size: .82rem;
      text-decoration: none; cursor: pointer; white-space: nowrap;
    }
    .watch-btn:hover { filter: brightness(1.08); }
    .new-tag {
      background: #53fc18; color: #000; border-radius: 4px; padding: .1rem .4rem;
      font-size: .68rem; font-weight: 900; margin-left: .4rem;
    }
    .empty { padding: 2rem; text-align: center; color: var(--text-muted); }
    .loading { padding: 2rem; text-align: center; color: var(--text-muted); }
    .rising-note { color: var(--text-muted); font-size: .88rem; margin-bottom: 1rem; }
    .cat-heading { font-size: 1.1rem; font-weight: 800; margin-bottom: 1rem; color: var(--accent); }
  `]
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  tab: 'live'|'today'|'hourly'|'weekly'|'monthly'|'alltime'|'category'|'rising' = 'live';
  liveRows: RankRow[] = [];
  rows: RankRow[] = [];
  loading = false;
  categories: Category[] = [];
  selectedCatSlug = '';
  selectedHour = new Date().getHours();
  hourlyDate = new Date().toISOString().slice(0, 10);
  monthlyMode: 'views' | 'hours' = 'views';
  hours24 = Array.from({ length: 24 }, (_, i) => i);

  private stompClient: Client | null = null;

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.loadCategories();
    this.connectWs();
    this.load();
  }

  private loadCategories(): void {
    this.http.get<any>('/api/categories?page=0&size=100').subscribe({
      next: (p) => (this.categories = p.content ?? []),
      error: () => {}
    });
  }

  setTab(t: typeof this.tab): void {
    this.tab = t;
    this.rows = [];
    this.load();
  }

  load(): void {
    if (this.tab === 'live') return; // loaded via WS
    this.loading = true;
    let url = '';
    let params = new HttpParams().set('page', 0);

    switch (this.tab) {
      case 'today':
        url = '/api/rankings/daily';
        if (this.selectedCatSlug) params = params.set('categorySlug', this.selectedCatSlug);
        break;
      case 'hourly':
        url = '/api/rankings/hourly';
        params = params.set('date', this.hourlyDate).set('hour', this.selectedHour);
        break;
      case 'weekly':
        url = '/api/rankings/weekly';
        break;
      case 'monthly':
        url = this.monthlyMode === 'hours' ? '/api/rankings/hours' : '/api/rankings/monthly';
        break;
      case 'alltime':
        url = '/api/rankings/alltime';
        if (this.selectedCatSlug) params = params.set('categorySlug', this.selectedCatSlug);
        break;
      case 'category':
        url = '/api/rankings/daily';
        if (this.selectedCatSlug) params = params.set('categorySlug', this.selectedCatSlug);
        break;
      case 'rising':
        url = '/api/rankings/rising';
        break;
    }

    this.http.get<RankRow[]>(url, { params }).subscribe({
      next: (data) => { this.rows = data; this.loading = false; },
      error: ()     => { this.loading = false; }
    });
  }

  private connectWs(): void {
    const base = resolveApiBaseUrl().replace(/\/$/, '');
    const sockUrl = base ? `${base}/ws` : '/ws';
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(sockUrl) as unknown as WebSocket,
      reconnectDelay: 8000
    });
    this.stompClient.onConnect = () => {
      this.stompClient?.subscribe('/topic/rankings.live', (msg: IMessage) => {
        this.liveRows = JSON.parse(msg.body) as RankRow[];
      });
    };
    this.stompClient.activate();
    // Also fetch immediately via HTTP
    this.http.get<RankRow[]>('/api/rankings/live').subscribe({
      next: (d) => (this.liveRows = d),
      error: () => {}
    });
  }

  isNew(_row: RankRow): boolean {
    return false;
  }

  catName(slug: string): string {
    return this.categories.find(c => c.slug === slug)?.name ?? slug;
  }

  ngOnDestroy(): void {
    this.stompClient?.deactivate();
  }
}
