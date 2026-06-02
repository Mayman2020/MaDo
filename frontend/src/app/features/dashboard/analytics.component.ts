import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { ChannelPublic, ChannelStatsResponse, StreamService } from '../../core/services/stream.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface AnalyticsSnapshotRow {
  id: string;
  viewerCount: number | null;
  chatRate: number | null;
  newFollows: number | null;
  newSubs: number | null;
  snapshotAt: string;
}

interface DashboardStats {
  isLive: boolean;
  viewerCount: number;
  followerCount: number;
  subscriberCount: number;
  totalViews: number;
}

@Component({
  selector: 'mado-analytics',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  template: `
    <div class="page">
      <h1 class="mado-heading">Analytics</h1>

      <!-- Summary cards -->
      @if (dashStats) {
        <div class="cards">
          <div class="card">
            <span class="card-val">{{ dashStats.followerCount | number }}</span>
            <span class="card-lbl">Followers</span>
          </div>
          <div class="card">
            <span class="card-val">{{ dashStats.subscriberCount | number }}</span>
            <span class="card-lbl">Subscribers</span>
          </div>
          <div class="card">
            <span class="card-val">{{ dashStats.totalViews | number }}</span>
            <span class="card-lbl">Total Views</span>
          </div>
          <div class="card" [class.live]="dashStats.isLive">
            <span class="card-val">{{ dashStats.isLive ? dashStats.viewerCount : '—' }}</span>
            <span class="card-lbl">{{ dashStats.isLive ? 'Live Viewers' : 'Offline' }}</span>
          </div>
        </div>
      }

      <!-- Viewer count chart -->
      @if (snapshots.length) {
        <section class="mado-card block">
          <h2>Viewer Count Over Time</h2>
          <canvas #viewerChart></canvas>
        </section>
      }

      <!-- Snapshots table -->
      @if (channel?.currentStreamId) {
        <section class="mado-card block">
          <h2>Live Session Snapshots</h2>
          <table>
            <thead>
              <tr><th>Time</th><th>Viewers</th><th>Chat/min</th><th>+Follows</th><th>+Subs</th></tr>
            </thead>
            <tbody>
              @for (s of snapshots; track s.id) {
                <tr>
                  <td>{{ s.snapshotAt | date:'shortTime' }}</td>
                  <td>{{ s.viewerCount | number }}</td>
                  <td>{{ s.chatRate }}</td>
                  <td>{{ s.newFollows }}</td>
                  <td>{{ s.newSubs }}</td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="muted">No snapshots yet.</td></tr>
              }
            </tbody>
          </table>
        </section>
      } @else {
        <p class="muted hint-block">Go live to collect per-stream analytics snapshots.</p>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 960px; margin: 0 auto; padding: 1rem 1rem 3rem; }
    h1 { color: var(--accent); font-size: 2rem; margin: 0 0 1.25rem; }
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .card {
      background: var(--bg-card);
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: .25rem;
    }
    .card-val { font-size: 2rem; font-weight: 800; }
    .card-lbl { font-size: .75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; }
    .card.live .card-val { color: var(--danger); }
    h2 { font-size: 1.05rem; margin: 0 0 .75rem; }
    .block { padding: 1.25rem; margin-bottom: 1rem; }
    canvas { max-height: 280px; }
    table { width: 100%; border-collapse: collapse; font-size: .85rem; }
    th, td { text-align: left; padding: .45rem; border-bottom: 1px solid var(--border); }
    .muted { color: var(--text-muted); }
    .hint-block { padding: 1rem; text-align: center; }
  `]
})
export class AnalyticsComponent implements OnInit, AfterViewInit {
  @ViewChild('viewerChart') chartRef?: ElementRef<HTMLCanvasElement>;

  channel: ChannelPublic | null = null;
  stats: ChannelStatsResponse | null = null;
  dashStats: DashboardStats | null = null;
  snapshots: AnalyticsSnapshotRow[] = [];
  private chartInstance: Chart | null = null;

  constructor(
    private readonly auth: AuthService,
    private readonly streams: StreamService,
    private readonly http: HttpClient
  ) {}

  ngOnInit(): void {
    const u = this.auth.currentUser$.value;
    if (!u) return;

    this.http.get<DashboardStats>('/api/dashboard/stats').subscribe({
      next: (s) => (this.dashStats = s),
      error: () => {}
    });

    this.streams.getChannel(u.username).subscribe((ch) => {
      this.channel = ch;
      if (ch.currentStreamId) {
        this.http
          .get<AnalyticsSnapshotRow[]>(`/api/streams/${ch.currentStreamId}/analytics/snapshots`)
          .subscribe((rows) => {
            this.snapshots = rows ?? [];
            this.renderChart();
          });
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.snapshots.length) this.renderChart();
  }

  private renderChart(): void {
    if (!this.chartRef?.nativeElement || !this.snapshots.length) return;
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
    this.chartInstance = new Chart(this.chartRef.nativeElement, {
      type: 'line',
      data: {
        labels: this.snapshots.map(s => new Date(s.snapshotAt).toLocaleTimeString()),
        datasets: [{
          label: 'Viewers',
          data: this.snapshots.map(s => s.viewerCount ?? 0),
          borderColor: '#53fc18',
          backgroundColor: 'rgba(83,252,24,.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: '#53fc18'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#5a5a72' }, grid: { color: 'rgba(255,255,255,.05)' } },
          y: { beginAtZero: true, ticks: { color: '#5a5a72' }, grid: { color: 'rgba(255,255,255,.05)' } }
        }
      }
    });
  }
}
