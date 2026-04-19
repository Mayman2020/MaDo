import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VideoPlayerComponent } from '../../shared/components/video-player/video-player.component';
import { ChatPanelComponent } from '../../shared/components/chat-panel/chat-panel.component';
import { ChannelEngagementComponent } from '../../shared/components/channel-engagement/channel-engagement.component';
import { StreamService, ChannelPublic } from '../../core/services/stream.service';
import { EmoteDto, EngagementService, StreamScheduleDto, VodDto } from '../../core/services/engagement.service';
import { AuthService } from '../../core/services/auth.service';
import { FollowService } from '../../core/services/follow.service';
import { ChatService } from '../../core/services/chat.service';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'mado-channel-page',
  standalone: true,
  imports: [VideoPlayerComponent, ChatPanelComponent, ChannelEngagementComponent, DatePipe],
  template: `
    @if (channel) {
      <div class="layout">
        <section class="main">
          <div class="row">
            <div class="titles">
              <h1 class="mado-heading">{{ channel.title }}</h1>
              <p class="meta">
                {{ channel.username }} · {{ displayViewers }} viewers
                @if (channel.categoryName) {
                  <span class="cat"> · {{ channel.categoryName }}</span>
                }
              </p>
            </div>
            <div class="actions">
              @if (canFollow) {
                <button type="button" class="follow" [class.on]="isFollowing" (click)="toggleFollow()" title="Follow">
                  {{ isFollowing ? 'Following' : 'Follow' }}
                </button>
              }
              @if (!isOwner && auth.currentUser$.value) {
                <button type="button" class="gift-subs" (click)="stubGift()">Gift Subs</button>
                <button type="button" class="subscribe" (click)="stubSub()">Subscribe</button>
              }
            </div>
          </div>

          @if (schedules.length) {
            <div class="sched-bar mado-card">
              <span class="lbl">Upcoming</span>
              @for (s of schedules; track s.id) {
                <span class="pill">{{ s.scheduledAt | date: 'short' }} — {{ s.title || 'Stream' }}</span>
              }
            </div>
          }
          @if (emotes.length) {
            <div class="emote-row">
              @for (e of emotes; track e.id) {
                <img [src]="e.imageUrl" [alt]="e.code" [title]="e.code" />
              }
            </div>
          }

          <div class="tabs">
            <button type="button" [class.on]="tab === 'watch'" (click)="tab = 'watch'">Watch</button>
            <button type="button" [class.on]="tab === 'videos'" (click)="tab = 'videos'; loadVods()">Videos</button>
          </div>

          @if (tab === 'watch') {
            @if (channel.isLive) {
              <mado-video-player [src]="hlsUrl" />
            } @else {
              <div class="offline mado-card">Offline</div>
            }
            <mado-channel-engagement [username]="channel.username" [isOwner]="isOwner" />
          } @else {
            <div class="vod-grid">
              @for (v of vods; track v.id) {
                <a class="vod mado-card" [href]="v.vodUrl" target="_blank" rel="noopener">
                  @if (v.thumbnailUrl) {
                    <img [src]="v.thumbnailUrl" [alt]="v.title || 'VOD'" />
                  } @else {
                    <div class="ph"></div>
                  }
                  <div class="vmeta">{{ v.title || 'Past broadcast' }}</div>
                </a>
              } @empty {
                <p class="muted full">No VODs published yet.</p>
              }
            </div>
          }
        </section>
        <aside class="side">
          <mado-chat-panel [channelId]="channel.id" />
        </aside>
      </div>
    }
  `,
  styles: [`
    .layout {
      display: grid;
      grid-template-columns: 1fr minmax(280px, 360px);
      gap: 1rem;
      max-width: 1480px;
      margin: 0 auto;
      padding: 1rem;
    }
    @media (max-width: 960px) {
      .layout { grid-template-columns: 1fr; }
    }
    .row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: .75rem;
    }
    .titles h1 { margin: 0; font-size: 1.75rem; line-height: 1.15; }
    .meta { color: var(--text-secondary); margin: .35rem 0 0; }
    .cat { color: var(--text-muted); }
    .follow {
      flex-shrink: 0;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      color: var(--text-primary);
      font-weight: 700;
      padding: .45rem 1.1rem;
      border-radius: 999px;
      cursor: pointer;
      font-family: inherit;
    }
    .follow.on {
      background: rgba(83, 252, 24, 0.12);
      border-color: var(--accent);
      color: var(--accent);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: .5rem;
      flex-shrink: 0;
    }
    .gift-subs {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text-primary);
      font-weight: 700;
      padding: .45rem 1rem;
      border-radius: 999px;
      cursor: pointer;
      font-family: inherit;
      font-size: .88rem;
    }
    .gift-subs:hover { border-color: var(--accent); color: var(--accent); }
    .subscribe {
      background: var(--accent);
      border: none;
      color: #000;
      font-weight: 800;
      padding: .45rem 1.15rem;
      border-radius: 999px;
      cursor: pointer;
      font-family: inherit;
      font-size: .88rem;
    }
    .subscribe:hover { filter: brightness(1.05); }
    .tabs {
      display: flex;
      gap: .5rem;
      margin-bottom: .75rem;
    }
    .tabs button {
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      color: var(--text-secondary);
      padding: .35rem 1rem;
      border-radius: 999px;
      cursor: pointer;
      font-weight: 700;
      font-family: inherit;
    }
    .tabs button.on {
      border-color: var(--accent);
      color: var(--accent);
    }
    .offline { padding: 4rem; text-align: center; color: var(--text-secondary); }
    .vod-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }
    .vod {
      text-decoration: none;
      color: inherit;
      overflow: hidden;
    }
    .vod img, .ph {
      width: 100%;
      aspect-ratio: 16/9;
      object-fit: cover;
      background: var(--bg-tertiary);
      display: block;
    }
    .vmeta { padding: .6rem .75rem; font-size: .9rem; font-weight: 600; }
    .muted { color: var(--text-muted); }
    .full { grid-column: 1 / -1; }
    .sched-bar {
      display: flex;
      flex-wrap: wrap;
      gap: .5rem;
      align-items: center;
      padding: .65rem 1rem;
      margin-bottom: .75rem;
      font-size: .85rem;
    }
    .sched-bar .lbl { font-weight: 800; color: var(--accent); margin-right: .35rem; }
    .pill { background: var(--bg-tertiary); padding: .2rem .5rem; border-radius: 6px; }
    .emote-row {
      display: flex;
      flex-wrap: wrap;
      gap: .35rem;
      margin-bottom: .75rem;
    }
    .emote-row img {
      width: 32px;
      height: 32px;
      object-fit: contain;
      border-radius: 6px;
      background: var(--bg-tertiary);
    }
  `]
})
export class ChannelPageComponent implements OnInit, OnDestroy {
  channel: ChannelPublic | null = null;
  hlsUrl = '';
  displayViewers = 0;
  isFollowing = false;
  canFollow = false;
  isOwner = false;
  tab: 'watch' | 'videos' = 'watch';
  vods: VodDto[] = [];
  schedules: StreamScheduleDto[] = [];
  emotes: EmoteDto[] = [];
  private viewerSub?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly streams: StreamService,
    readonly auth: AuthService,
    private readonly follows: FollowService,
    private readonly chat: ChatService,
    private readonly engagement: EngagementService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const username = this.route.snapshot.paramMap.get('username') ?? '';
    this.streams.getChannel(username).subscribe((ch) => {
      this.channel = ch;
      this.hlsUrl = ch.hlsMasterUrl ?? '';
      this.displayViewers = ch.viewerCount;
      const me = this.auth.currentUser$.value;
      const token = this.auth.getAccessToken();
      this.isOwner = !!(me && ch.username === me.username);
      if (token && me && ch.username !== me.username) {
        this.canFollow = true;
        this.follows.getFollowing().subscribe((list) => {
          this.isFollowing = list.some((c) => c.id === ch.id);
        });
      } else {
        this.canFollow = false;
        this.isFollowing = false;
      }
      this.viewerSub = this.chat.viewerCount$.subscribe((v) => {
        if (v > 0) {
          this.displayViewers = v;
        }
      });
      this.engagement.schedules(username).subscribe((s) => (this.schedules = s ?? []));
      this.engagement.emotes(username).subscribe((e) => (this.emotes = e ?? []));
    });
  }

  loadVods(): void {
    if (!this.channel) {
      return;
    }
    this.engagement.vods(this.channel.username, 0, 24).subscribe((p) => (this.vods = p.content ?? []));
  }

  stubGift(): void {
    this.toastr.info('Gift subs checkout is not wired in this build.');
  }

  stubSub(): void {
    this.toastr.info('Channel subscriptions are not wired in this build.');
  }

  toggleFollow(): void {
    if (!this.channel) {
      return;
    }
    const id = this.channel.id;
    if (this.isFollowing) {
      this.follows.unfollow(id).subscribe(() => (this.isFollowing = false));
    } else {
      this.follows.follow(id).subscribe(() => (this.isFollowing = true));
    }
  }

  ngOnDestroy(): void {
    this.viewerSub?.unsubscribe();
  }
}
