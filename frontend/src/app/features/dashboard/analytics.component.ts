import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { ChannelPublic, ChannelStatsResponse, StreamService } from '../../core/services/stream.service';

interface AnalyticsSnapshotRow {
  id: string;
  viewerCount: number | null;
  chatRate: number | null;
  newFollows: number | null;
  newSubs: number | null;
  snapshotAt: string;
}

@Component({
  selector: 'mado-analytics',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="page">
      <h1 class="mado-heading">Analytics</h1>
      @if (stats) {
        <section class="stats mado-card">
          <div><span class="lab">Followers</span><strong>{{ stats.followerCount }}</strong></div>
          <div><span class="lab">Subs</span><strong>{{ stats.subscriberCount }}</strong></div>
          <div><span class="lab">Total views</span><strong>{{ stats.totalViews }}</strong></div>
          <div><span class="lab">Peak viewers</span><strong>{{ stats.peakViewerCount }}</strong></div>
        </section>
      }
      @if (channel?.currentStreamId) {
        <section class="mado-card block">
          <h2>Live session snapshots</h2>
          <p class="muted">Stream id: <code>{{ channel?.currentStreamId }}</code></p>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Viewers</th>
                <th>Chat/min</th>
                <th>+Follows</th>
                <th>+Subs</th>
              </tr>
            </thead>
            <tbody>
              @for (s of snapshots; track s.id) {
                <tr>
                  <td>{{ s.snapshotAt | date: 'medium' }}</td>
                  <td>{{ s.viewerCount }}</td>
                  <td>{{ s.chatRate }}</td>
                  <td>{{ s.newFollows }}</td>
                  <td>{{ s.newSubs }}</td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="muted">No snapshots yet (record from your tools or cron).</td></tr>
              }
            </tbody>
          </table>
        </section>
      } @else {
        <p class="muted">Go live to collect per-stream snapshots.</p>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 960px; margin: 0 auto; padding: 1rem 1rem 3rem; }
    h1 { color: var(--accent); font-size: 2rem; margin: 0 0 1rem; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 1rem;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .stats div { display: flex; flex-direction: column; gap: .25rem; }
    .lab { font-size: .75rem; color: var(--text-muted); text-transform: uppercase; }
    h2 { font-size: 1.05rem; margin: 0 0 .75rem; }
    .block { padding: 1.25rem; }
    table { width: 100%; border-collapse: collapse; font-size: .85rem; }
    th, td { text-align: left; padding: .45rem; border-bottom: 1px solid var(--border); }
    code { color: var(--accent); font-size: .85rem; }
    .muted { color: var(--text-muted); }
  `]
})
export class AnalyticsComponent implements OnInit {
  channel: ChannelPublic | null = null;
  stats: ChannelStatsResponse | null = null;
  snapshots: AnalyticsSnapshotRow[] = [];

  constructor(
    private readonly auth: AuthService,
    private readonly streams: StreamService,
    private readonly http: HttpClient
  ) {}

  ngOnInit(): void {
    const u = this.auth.currentUser$.value;
    if (!u) {
      return;
    }
    this.streams.getChannel(u.username).subscribe((ch) => {
      this.channel = ch;
      this.streams.getChannelStats(u.username).subscribe((s) => (this.stats = s));
      if (ch.currentStreamId) {
        this.http
          .get<AnalyticsSnapshotRow[]>(`/api/streams/${ch.currentStreamId}/analytics/snapshots`)
          .subscribe((rows) => (this.snapshots = rows ?? []));
      }
    });
  }
}
