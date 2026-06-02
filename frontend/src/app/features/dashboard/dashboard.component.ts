import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../core/services/auth.service';
import {
  EmoteDto,
  EngagementService,
  StreamScheduleDto
} from '../../core/services/engagement.service';
import { Category, ChannelPublic, StreamService } from '../../core/services/stream.service';
import { environment } from '../../../environments/environment';

interface ChatSettings {
  slowModeSeconds: number;
  followersOnlyMode: boolean;
  subscribersOnlyMode: boolean;
  emotesOnlyMode: boolean;
  minAccountAgeDays: number;
}

interface DashboardStats {
  isLive: boolean;
  viewerCount: number;
  followerCount: number;
  subscriberCount: number;
  totalViews: number;
}

interface StreamHealth {
  publishing: boolean;
  streamName?: string | null;
  bitrateKbps?: number | null;
  fps?: number | null;
  droppedFrames?: number | null;
  width?: number | null;
  height?: number | null;
  activeSubscribers?: number | null;
  rawMessage?: string | null;
}

@Component({
  selector: 'mado-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, FormsModule, DatePipe, DecimalPipe],
  template: `
    <div class="page">
      <h1 class="mado-heading">Streamer dashboard</h1>
      <p class="lead">OBS / FFmpeg ingest and stream keys</p>

      <!-- Stats bar -->
      @if (stats) {
        <div class="stats-bar">
          <div class="stat-item" [class.live]="stats.isLive">
            <span class="stat-val">{{ stats.isLive ? 'LIVE' : 'OFFLINE' }}</span>
            <span class="stat-label">Status</span>
          </div>
          <div class="stat-item">
            <span class="stat-val">{{ stats.viewerCount | number }}</span>
            <span class="stat-label">Viewers</span>
          </div>
          <div class="stat-item">
            <span class="stat-val">{{ stats.followerCount | number }}</span>
            <span class="stat-label">Followers</span>
          </div>
          <div class="stat-item">
            <span class="stat-val">{{ stats.subscriberCount | number }}</span>
            <span class="stat-label">Subscribers</span>
          </div>
          <div class="stat-item">
            <span class="stat-val">{{ stats.totalViews | number }}</span>
            <span class="stat-label">Total Views</span>
          </div>
        </div>
      }

      <section class="mado-card block health-card">
        <h2>Stream health</h2>
        <p class="hint">Ingest stats from nginx-rtmp (updates while you are live).</p>
        @if (streamHealth) {
          @if (streamHealth.publishing) {
            <ul class="health-list">
              <li><span class="hk">Bitrate</span> <span class="hv">{{ streamHealth.bitrateKbps ?? 0 }} kbps</span></li>
              <li><span class="hk">FPS</span> <span class="hv">{{ streamHealth.fps != null ? (streamHealth.fps | number:'1.0-2') : '—' }}</span></li>
              <li><span class="hk">Dropped frames</span> <span class="hv">{{ streamHealth.droppedFrames ?? 0 }}</span></li>
              @if (streamHealth.width && streamHealth.height) {
                <li><span class="hk">Resolution</span> <span class="hv">{{ streamHealth.width }}×{{ streamHealth.height }}</span></li>
              }
              @if (streamHealth.activeSubscribers != null) {
                <li><span class="hk">RTMP clients</span> <span class="hv">{{ streamHealth.activeSubscribers }}</span></li>
              }
            </ul>
          } @else {
            <p class="muted">
              {{ streamHealth.rawMessage || 'No active publish detected on RTMP stat.' }}
            </p>
          }
        } @else {
          <p class="muted">Loading health…</p>
        }
      </section>

      <nav class="subnav">
        <a routerLink="/dashboard" [routerLinkActiveOptions]="{exact:true}" routerLinkActive="active">Stream</a>
        <a routerLink="/dashboard/analytics" routerLinkActive="active">Analytics</a>
        <a routerLink="/dashboard/clips" routerLinkActive="active">Clips</a>
        <a routerLink="/dashboard/vods" routerLinkActive="active">VODs</a>
        <a routerLink="/dashboard/emotes" routerLinkActive="active">Emotes</a>
        <a routerLink="/dashboard/channel-points" routerLinkActive="active">Channel Points</a>
        <a routerLink="/dashboard/moderators" routerLinkActive="active">Moderators</a>
        <a routerLink="/dashboard/moderation" routerLinkActive="active">Bans</a>
        <a routerLink="/dashboard/progress" routerLinkActive="active">Tier & Progress</a>
        <a routerLink="/dashboard/milestones" routerLinkActive="active">Milestones</a>
        <a routerLink="/dashboard/earnings" routerLinkActive="active">Earnings</a>
        <a routerLink="/dashboard/goals" routerLinkActive="active">Goals</a>
      </nav>

      @if (channel) {
        <section class="mado-card block">
          <h2>RTMP ingest</h2>
          <p class="mono">Server: <code>{{ rtmpUrl }}</code></p>
          <p class="mono">Stream key: <code>{{ channel.streamKey }}</code></p>
          <p class="hint">In OBS: Settings → Stream → Custom → paste server + key.</p>
        </section>

        <section class="mado-card block">
          <h2>Playback (viewers)</h2>
          @if (channel.hlsMasterUrl) {
            <p class="mono">HLS: <code>{{ channel.hlsMasterUrl }}</code></p>
          } @else {
            <p class="muted">HLS URL appears when you are live.</p>
          }
        </section>

        <section class="mado-card block">
          <h2>Stream key</h2>
          <p>
            <button type="button" class="btn secondary" (click)="copyKey()">Copy key</button>
            <button type="button" class="btn danger" (click)="resetKey()">Reset key</button>
          </p>
          @if (resetMessage) {
            <p class="ok">{{ resetMessage }}</p>
          }
        </section>

        <section class="mado-card block">
          <h2>Raid another channel</h2>
          <p class="hint">Sends your viewers to a target channel. The target streamer completes the raid from their dashboard.</p>
          <div class="row">
            <input [(ngModel)]="raidTarget" placeholder="Target username" />
            <input type="number" [(ngModel)]="raidViewers" min="0" placeholder="Viewer count" />
            <button type="button" class="btn" (click)="startRaid()">Start raid</button>
          </div>
        </section>

        <section class="mado-card block">
          <h2>Upcoming streams</h2>
          <ul class="sched">
            @for (s of schedules; track s.id) {
              <li>
                <span>{{ s.scheduledAt | date: 'medium' }}</span>
                — {{ s.title || 'Stream' }}
                <button type="button" class="link" (click)="cancelSchedule(s.id)">Cancel</button>
              </li>
            } @empty {
              <li class="muted">No upcoming schedules</li>
            }
          </ul>
          <h3 class="subh">Add schedule</h3>
          <div class="col">
            <input [(ngModel)]="schedTitle" placeholder="Title" />
            <input type="datetime-local" [(ngModel)]="schedLocal" />
            <input type="number" [(ngModel)]="schedDuration" min="15" placeholder="Duration (min)" />
            <select [(ngModel)]="schedCategoryId">
              <option value="">Category (optional)</option>
              @for (c of categories; track c.id) {
                <option [value]="c.id">{{ c.name }}</option>
              }
            </select>
            <button type="button" class="btn" (click)="addSchedule()">Save</button>
          </div>
        </section>

        <section class="mado-card block">
          <h2>Channel emotes</h2>
          <div class="emote-grid">
            @for (e of emotes; track e.id) {
              <div class="em">
                <img [src]="e.imageUrl" [alt]="e.code" />
                <span>{{ e.code }}</span>
                <button type="button" class="link" (click)="removeEmote(e.id)">Delete</button>
              </div>
            }
          </div>
          <div class="col">
            <input [(ngModel)]="emoteName" placeholder="Name" />
            <input [(ngModel)]="emoteCode" placeholder="Code (e.g. pepeL)" />
            <input [(ngModel)]="emoteUrl" placeholder="Image URL" />
            <button type="button" class="btn" (click)="addEmote()">Add emote</button>
          </div>
        </section>

        <section class="mado-card block">
          <h2>Chat settings</h2>
          @if (chatSettings) {
            <div class="chat-set-grid">
              <div class="cs-row">
                <label class="cs-label">
                  <input type="checkbox" [(ngModel)]="chatSettings.followersOnlyMode" (change)="saveChatSettings()" />
                  Followers-only mode
                </label>
                <span class="cs-hint">Only followers can send messages</span>
              </div>
              <div class="cs-row">
                <label class="cs-label">
                  <input type="checkbox" [(ngModel)]="chatSettings.subscribersOnlyMode" (change)="saveChatSettings()" />
                  Subscribers-only mode
                </label>
                <span class="cs-hint">Only subscribers can chat</span>
              </div>
              <div class="cs-row">
                <label class="cs-label">
                  <input type="checkbox" [(ngModel)]="chatSettings.emotesOnlyMode" (change)="saveChatSettings()" />
                  Emotes-only mode
                </label>
                <span class="cs-hint">Messages must contain only emote codes</span>
              </div>
              <div class="cs-field-row">
                <label class="cs-field-label">Slow mode (seconds)</label>
                <input
                  type="number"
                  min="0" max="120"
                  class="cs-num"
                  [(ngModel)]="chatSettings.slowModeSeconds"
                  placeholder="0 = off"
                />
                <button class="btn secondary" (click)="saveChatSettings()">Apply</button>
              </div>
              <div class="cs-field-row">
                <label class="cs-field-label">Min account age (days)</label>
                <input
                  type="number"
                  min="0" max="365"
                  class="cs-num"
                  [(ngModel)]="chatSettings.minAccountAgeDays"
                  placeholder="0 = off"
                />
                <button class="btn secondary" (click)="saveChatSettings()">Apply</button>
              </div>
            </div>
          } @else {
            <p class="hint">Loading…</p>
          }
        </section>
        <!-- Activity feed -->
        <section class="mado-card block">
          <h2>Activity Feed</h2>
          <ul class="feed">
            @for (n of activityFeed; track n.id) {
              <li class="feed-item">
                <span class="feed-type {{ n.type?.toLowerCase() }}">{{ feedIcon(n.type) }}</span>
                <span class="feed-text">{{ n.message }}</span>
                <span class="feed-time">{{ n.createdAt | date:'shortTime' }}</span>
              </li>
            } @empty {
              <li class="muted">No recent activity</li>
            }
          </ul>
        </section>

      } @else {
        <p>Loading channel…</p>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 800px; margin: 0 auto; padding: 1rem 1rem 3rem; }
    h1 { color: var(--accent); font-size: 2.25rem; margin: 0 0 .25rem; }
    .lead { color: var(--text-secondary); margin-bottom: 1.25rem; }
    .subnav { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .subnav a { color: var(--accent); font-weight: 700; text-decoration: none; }
    .subnav a:hover { text-decoration: underline; }
    h2 { font-size: 1.1rem; margin: 0 0 .75rem; }
    .subh { font-size: .95rem; margin: 1rem 0 .5rem; color: var(--text-secondary); }
    .block { padding: 1.25rem; margin-bottom: 1rem; }
    .mono { font-family: "JetBrains Mono", monospace; font-size: .85rem; word-break: break-all; }
    code { color: var(--accent); }
    .hint { color: var(--text-muted); font-size: .85rem; margin-top: .5rem; }
    .muted { color: var(--text-secondary); }
    .btn {
      background: var(--accent);
      color: #000;
      border: none;
      border-radius: 8px;
      font-weight: 800;
      padding: .5rem 1rem;
      cursor: pointer;
      font-family: inherit;
      margin-right: .5rem;
    }
    .btn.secondary { background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border); }
    .btn.danger { background: transparent; color: var(--danger); border: 1px solid var(--danger); }
    .ok { color: var(--accent); font-size: .9rem; }
    .row { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; margin-top: .5rem; }
    .row input { flex: 1; min-width: 120px; }
    input, select {
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text-primary);
      padding: .5rem .65rem;
      font-family: inherit;
    }
    .sched { list-style: none; padding: 0; margin: 0 0 1rem; }
    .sched li { padding: .35rem 0; border-bottom: 1px solid var(--border); font-size: .9rem; display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }
    .col { display: flex; flex-direction: column; gap: .5rem; max-width: 400px; }
    .link { background: none; border: none; color: var(--warning); cursor: pointer; font-family: inherit; font-size: .85rem; }
    .emote-grid { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; }
    .em { display: flex; flex-direction: column; align-items: center; gap: .25rem; font-size: .75rem; }
    .em img { width: 48px; height: 48px; object-fit: contain; background: var(--bg-tertiary); border-radius: 8px; }
    .chat-set-grid { display: flex; flex-direction: column; gap: .85rem; }
    .cs-row { display: flex; flex-direction: column; gap: .15rem; }
    .cs-label { display: flex; align-items: center; gap: .5rem; font-weight: 700; cursor: pointer; }
    .cs-label input[type=checkbox] { width: 16px; height: 16px; accent-color: var(--accent); cursor: pointer; }
    .cs-hint { font-size: .8rem; color: var(--text-muted); padding-left: 1.35rem; }
    .cs-field-row { display: flex; align-items: center; gap: .65rem; flex-wrap: wrap; }
    .cs-field-label { font-weight: 700; font-size: .88rem; min-width: 170px; }
    .cs-num { width: 80px; text-align: center; }
    .stats-bar {
      display: flex; gap: 1rem; flex-wrap: wrap;
      background: var(--bg-card); border-radius: 12px; padding: 1rem 1.25rem;
      margin-bottom: 1rem;
    }
    .stat-item { display: flex; flex-direction: column; align-items: center; min-width: 80px; flex: 1; }
    .stat-val { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); }
    .stat-val { color: var(--text-primary); }
    .stat-item.live .stat-val { color: var(--danger); }
    .stat-label { font-size: .75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; }
    .health-card .health-list { list-style: none; padding: 0; margin: .5rem 0 0; display: grid; gap: .4rem; }
    .health-card .health-list li { display: flex; justify-content: space-between; gap: 1rem; font-size: .9rem; }
    .hk { color: var(--text-muted); }
    .hv { font-weight: 700; font-family: "JetBrains Mono", monospace; }
    .subnav a.active { color: var(--text-primary); border-bottom: 2px solid var(--accent); padding-bottom: 2px; }
    .feed { list-style: none; padding: 0; margin: 0; max-height: 300px; overflow-y: auto; }
    .feed-item { display: flex; align-items: baseline; gap: .5rem; padding: .4rem 0; border-bottom: 1px solid var(--border); font-size: .875rem; }
    .feed-type { font-size: 1rem; min-width: 1.5rem; }
    .feed-text { flex: 1; color: var(--text-secondary); }
    .feed-time { color: var(--text-muted); font-size: .75rem; }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  channel: ChannelPublic | null = null;
  stats: DashboardStats | null = null;
  streamHealth: StreamHealth | null = null;
  private healthPoll: ReturnType<typeof setInterval> | null = null;
  activityFeed: any[] = [];
  resetMessage = '';
  rtmpUrl = environment.rtmpIngestUrl;

  raidTarget = '';
  raidViewers: number | null = 100;

  schedules: StreamScheduleDto[] = [];
  categories: Category[] = [];
  schedTitle = '';
  schedLocal = '';
  schedDuration: number | null = 60;
  schedCategoryId = '';

  emotes: EmoteDto[] = [];
  emoteName = '';
  emoteCode = '';
  emoteUrl = '';

  chatSettings: ChatSettings | null = null;

  constructor(
    private readonly auth: AuthService,
    private readonly streams: StreamService,
    private readonly engagement: EngagementService,
    private readonly http: HttpClient,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const u = this.auth.currentUser$.value;
    if (!u) return;
    this.streams.getChannel(u.username).subscribe((ch) => {
      this.channel = ch;
      this.reloadSchedulesEmotes(u.username);
      this.loadChatSettings(u.username);
    });
    this.streams.getCategories(0, 100).subscribe((p) => (this.categories = p.content ?? []));
    this.http.get<DashboardStats>('/api/dashboard/stats').subscribe({
      next: (s) => (this.stats = s),
      error: () => {}
    });
    this.http.get<{ content: any[] }>('/api/dashboard/activity-feed?page=0').subscribe({
      next: (p) => (this.activityFeed = p.content ?? []),
      error: () => {}
    });
    this.loadStreamHealth();
    this.healthPoll = setInterval(() => this.loadStreamHealth(), 8000);
  }

  ngOnDestroy(): void {
    if (this.healthPoll) {
      clearInterval(this.healthPoll);
      this.healthPoll = null;
    }
  }

  private loadStreamHealth(): void {
    this.http.get<StreamHealth>('/api/dashboard/stream-health').subscribe({
      next: (h) => (this.streamHealth = h),
      error: () => {}
    });
  }

  feedIcon(type: string | null): string {
    switch (type) {
      case 'FOLLOW': return '🟢';
      case 'SUB': case 'SUBSCRIPTION': return '⭐';
      case 'GIFT_SUB': return '🎁';
      case 'DONATION': return '💰';
      case 'RAID': case 'RAID_INCOMING': return '⚔️';
      case 'CHANNEL_POINT': return '🎯';
      default: return '🔔';
    }
  }

  loadChatSettings(username: string): void {
    this.http.get<ChatSettings>(`/api/channels/${encodeURIComponent(username)}/chat-settings`).subscribe({
      next: (s) => (this.chatSettings = s),
      error: () => (this.chatSettings = { slowModeSeconds: 0, followersOnlyMode: false, subscribersOnlyMode: false, emotesOnlyMode: false, minAccountAgeDays: 0 })
    });
  }

  saveChatSettings(): void {
    const u = this.auth.currentUser$.value;
    if (!u || !this.chatSettings) return;
    this.http.patch(`/api/channels/${encodeURIComponent(u.username)}/chat-settings`, this.chatSettings).subscribe({
      next: () => this.toastr.success('Chat settings saved'),
      error: () => this.toastr.error('Could not save chat settings')
    });
  }

  reloadSchedulesEmotes(username: string): void {
    this.engagement.schedules(username).subscribe((s) => (this.schedules = s ?? []));
    this.engagement.emotes(username).subscribe((e) => (this.emotes = e ?? []));
  }

  copyKey(): void {
    if (!this.channel) {
      return;
    }
    void navigator.clipboard.writeText(this.channel.streamKey);
    this.resetMessage = 'Copied stream key.';
    setTimeout(() => (this.resetMessage = ''), 2500);
  }

  resetKey(): void {
    const u = this.auth.currentUser$.value;
    if (!u) {
      return;
    }
    if (!confirm('Reset stream key? You must update OBS.')) {
      return;
    }
    this.streams.resetStreamKey(u.username).subscribe({
      next: (r) => {
        if (this.channel) {
          this.channel = { ...this.channel, streamKey: r.streamKey };
        }
        this.streams.invalidateDiscoveryCache();
        this.resetMessage = 'New key generated.';
      }
    });
  }

  startRaid(): void {
    const u = this.auth.currentUser$.value;
    if (!u || !this.raidTarget.trim()) {
      this.toastr.warning('Enter target username');
      return;
    }
    this.engagement
      .startRaid(u.username, {
        targetUsername: this.raidTarget.trim(),
        viewerCount: this.raidViewers ?? 0
      })
      .subscribe({
        next: () => {
          this.toastr.success('Raid started');
          this.raidTarget = '';
        }
      });
  }

  addSchedule(): void {
    const u = this.auth.currentUser$.value;
    if (!u || !this.schedLocal) {
      this.toastr.warning('Pick date & time');
      return;
    }
    const d = new Date(this.schedLocal);
    const body: { title?: string; scheduledAt: string; durationMinutes?: number; category?: { id: string } } = {
      scheduledAt: d.toISOString(),
      durationMinutes: this.schedDuration ?? undefined,
      title: this.schedTitle || undefined
    };
    if (this.schedCategoryId) {
      body.category = { id: this.schedCategoryId };
    }
    this.engagement.createSchedule(u.username, body).subscribe({
      next: () => {
        this.toastr.success('Schedule saved');
        this.schedTitle = '';
        this.schedLocal = '';
        this.reloadSchedulesEmotes(u.username);
      }
    });
  }

  cancelSchedule(id: string): void {
    const u = this.auth.currentUser$.value;
    if (!u) {
      return;
    }
    this.engagement.cancelSchedule(u.username, id).subscribe({ next: () => this.reloadSchedulesEmotes(u.username) });
  }

  addEmote(): void {
    const u = this.auth.currentUser$.value;
    if (!u || !this.emoteName.trim() || !this.emoteCode.trim() || !this.emoteUrl.trim()) {
      this.toastr.warning('Fill name, code, and image URL');
      return;
    }
    this.engagement
      .createEmote(u.username, {
        name: this.emoteName.trim(),
        code: this.emoteCode.trim(),
        imageUrl: this.emoteUrl.trim()
      })
      .subscribe({
        next: () => {
          this.toastr.success('Emote added');
          this.emoteName = '';
          this.emoteCode = '';
          this.emoteUrl = '';
          this.reloadSchedulesEmotes(u.username);
        }
      });
  }

  removeEmote(id: string): void {
    const u = this.auth.currentUser$.value;
    if (!u) {
      return;
    }
    this.engagement.deleteEmote(u.username, id).subscribe({ next: () => this.reloadSchedulesEmotes(u.username) });
  }
}
