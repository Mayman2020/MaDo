import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../core/services/auth.service';
import {
  EmoteDto,
  EngagementService,
  StreamScheduleDto
} from '../../core/services/engagement.service';
import { Category, ChannelPublic, StreamService } from '../../core/services/stream.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'mado-dashboard',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe],
  template: `
    <div class="page">
      <h1 class="mado-heading">Streamer dashboard</h1>
      <p class="lead">OBS / FFmpeg ingest and stream keys</p>

      <nav class="subnav">
        <a routerLink="/dashboard/analytics">Analytics</a>
        <a routerLink="/dashboard/moderation">Moderation</a>
        <a routerLink="/subscriptions">Subscriptions</a>
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
  `]
})
export class DashboardComponent implements OnInit {
  channel: ChannelPublic | null = null;
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

  constructor(
    private readonly auth: AuthService,
    private readonly streams: StreamService,
    private readonly engagement: EngagementService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const u = this.auth.currentUser$.value;
    if (!u) {
      return;
    }
    this.streams.getChannel(u.username).subscribe((ch) => {
      this.channel = ch;
      this.reloadSchedulesEmotes(u.username);
    });
    this.streams.getCategories(0, 100).subscribe((p) => (this.categories = p.content ?? []));
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
