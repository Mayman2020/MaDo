import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VideoPlayerComponent } from '../../shared/components/video-player/video-player.component';
import { ChatPanelComponent } from '../../shared/components/chat-panel/chat-panel.component';
import { ChannelEngagementComponent } from '../../shared/components/channel-engagement/channel-engagement.component';
import { StreamService, ChannelPublic } from '../../core/services/stream.service';
import { EmoteDto, EngagementService, StreamScheduleDto, VodDto } from '../../core/services/engagement.service';
import { AuthService } from '../../core/services/auth.service';
import { FollowService } from '../../core/services/follow.service';
import { ChatService } from '../../core/services/chat.service';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'mado-channel-page',
  standalone: true,
  imports: [VideoPlayerComponent, ChatPanelComponent, ChannelEngagementComponent, DatePipe, FormsModule],
  template: `
    @if (channel) {
      <div class="layout" [class.theater]="theaterMode">
        <section class="main">

          <!-- title row -->
          <div class="row">
            <div class="titles">
              @if (isOwner && editingTitle) {
                <div class="title-edit-row">
                  <input class="title-input" [(ngModel)]="titleDraft" maxlength="140" (keydown.enter)="saveTitle()" (keydown.escape)="editingTitle = false" />
                  <button class="save-btn" (click)="saveTitle()">Save</button>
                  <button class="cancel-btn" (click)="editingTitle = false">Cancel</button>
                </div>
              } @else {
                <h1 class="mado-heading" (click)="isOwner && startEditTitle()">
                  {{ channel.title }}
                  @if (isOwner) {
                    <span class="edit-ic" title="Edit title">✎</span>
                  }
                </h1>
              }
              <p class="meta">
                {{ channel.username }} · {{ fmt(displayViewers) }} viewers
                @if (channel.categoryName) {
                  <span class="cat"> · {{ channel.categoryName }}</span>
                }
                @if (channel.isLive) {
                  <span class="live-pill">LIVE</span>
                }
              </p>
            </div>
            <div class="actions">
              <button type="button" class="icon-btn" (click)="share()" title="Share stream">
                <span>⎙</span> Share
              </button>
              <button type="button" class="icon-btn" (click)="toggleTheater()" title="Theater mode">
                @if (theaterMode) { <span>⊡</span> Default } @else { <span>⊟</span> Theater }
              </button>
              @if (channel.isLive && auth.getAccessToken()) {
                <button type="button" class="icon-btn clip-btn" (click)="openClipModal()" title="Create a clip">
                  ✂ Clip
                </button>
              }
              @if (canFollow) {
                <button type="button" class="follow" [class.on]="isFollowing" (click)="toggleFollow()">
                  {{ isFollowing ? 'Following' : '+ Follow' }}
                </button>
              }
              @if (!isOwner && auth.currentUser$.value) {
                <button type="button" class="gift-subs" (click)="stubGift()">🎁 Gift</button>
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
              <div class="offline mado-card">
                <div class="offline-icon">📡</div>
                <p>{{ channel.username }} is currently offline</p>
              </div>
            }
            @if (!theaterMode) {
              <mado-channel-engagement [username]="channel.username" [isOwner]="isOwner" />
            }
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

    <!-- Clip modal -->
    @if (clipModalOpen) {
      <div class="modal-backdrop" (click)="clipModalOpen = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-head">✂ Create clip</div>
          <label class="modal-label">Clip title</label>
          <input class="modal-input" [(ngModel)]="clipTitle" maxlength="140" placeholder="Enter a title for your clip…" />
          <div class="modal-actions">
            <button class="modal-cancel" (click)="clipModalOpen = false">Cancel</button>
            <button class="modal-submit" (click)="createClip()" [disabled]="!clipTitle.trim() || clipSaving">
              {{ clipSaving ? 'Saving…' : 'Create clip' }}
            </button>
          </div>
        </div>
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
      transition: grid-template-columns .25s ease;
    }
    .layout.theater {
      grid-template-columns: 1fr minmax(280px, 320px);
      max-width: 100%;
    }
    @media (max-width: 960px) {
      .layout, .layout.theater { grid-template-columns: 1fr; }
    }
    .row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: .75rem;
      flex-wrap: wrap;
    }
    .titles h1 {
      margin: 0;
      font-size: 1.5rem;
      line-height: 1.2;
      cursor: default;
      display: flex;
      align-items: center;
      gap: .5rem;
    }
    .edit-ic {
      font-size: .9rem;
      color: var(--text-muted);
      opacity: 0;
      transition: opacity .15s;
      cursor: pointer;
    }
    .titles h1:hover .edit-ic { opacity: 1; }
    .title-edit-row {
      display: flex;
      gap: .5rem;
      align-items: center;
      margin-bottom: .25rem;
    }
    .title-input {
      flex: 1;
      background: var(--bg-tertiary);
      border: 1px solid var(--accent);
      border-radius: 8px;
      color: var(--text-primary);
      padding: .4rem .75rem;
      font-size: 1.1rem;
      font-family: inherit;
      font-weight: 700;
      outline: none;
    }
    .save-btn {
      background: var(--accent);
      color: #000;
      border: none;
      border-radius: 8px;
      padding: .4rem .9rem;
      font-weight: 800;
      cursor: pointer;
      font-family: inherit;
    }
    .cancel-btn {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text-secondary);
      border-radius: 8px;
      padding: .4rem .9rem;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
    }
    .meta { color: var(--text-secondary); margin: .35rem 0 0; }
    .cat { color: var(--text-muted); }
    .live-pill {
      display: inline-block;
      margin-left: .4rem;
      background: #e53935;
      color: #fff;
      font-size: .65rem;
      font-weight: 900;
      letter-spacing: .07em;
      padding: .15rem .5rem;
      border-radius: 4px;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: .5rem;
      flex-shrink: 0;
    }
    .icon-btn {
      display: inline-flex;
      align-items: center;
      gap: .3rem;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      color: var(--text-secondary);
      font-size: .82rem;
      font-weight: 700;
      padding: .38rem .8rem;
      border-radius: 8px;
      cursor: pointer;
      font-family: inherit;
      transition: border-color .15s, color .15s;
    }
    .icon-btn:hover { border-color: var(--accent); color: var(--accent); }
    .clip-btn:hover { border-color: #ff9800; color: #ff9800; }
    .follow {
      flex-shrink: 0;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      color: var(--text-primary);
      font-weight: 700;
      padding: .42rem 1.1rem;
      border-radius: 999px;
      cursor: pointer;
      font-family: inherit;
    }
    .follow.on {
      background: rgba(83, 252, 24, 0.12);
      border-color: var(--accent);
      color: var(--accent);
    }
    .gift-subs {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text-primary);
      font-weight: 700;
      padding: .42rem 1rem;
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
      padding: .42rem 1.15rem;
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
    .tabs button.on { border-color: var(--accent); color: var(--accent); }
    .offline {
      padding: 3rem 2rem;
      text-align: center;
      color: var(--text-secondary);
    }
    .offline-icon { font-size: 2.5rem; margin-bottom: .75rem; }
    .offline p { margin: 0; font-size: 1rem; }
    .vod-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }
    .vod { text-decoration: none; color: inherit; overflow: hidden; }
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
    .emote-row img { width: 32px; height: 32px; object-fit: contain; border-radius: 6px; background: var(--bg-tertiary); }
    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
    }
    .modal {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.5rem;
      width: min(420px, 90vw);
      box-shadow: 0 20px 60px rgba(0,0,0,.5);
    }
    .modal-head {
      font-size: 1.1rem;
      font-weight: 800;
      margin-bottom: 1rem;
      color: var(--text-primary);
    }
    .modal-label {
      display: block;
      font-size: .82rem;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: .35rem;
      text-transform: uppercase;
      letter-spacing: .04em;
    }
    .modal-input {
      width: 100%;
      box-sizing: border-box;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text-primary);
      padding: .55rem .85rem;
      font-family: inherit;
      font-size: .95rem;
      outline: none;
      margin-bottom: 1.25rem;
    }
    .modal-input:focus { border-color: var(--accent); }
    .modal-actions { display: flex; gap: .75rem; justify-content: flex-end; }
    .modal-cancel {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text-secondary);
      border-radius: 8px;
      padding: .5rem 1.1rem;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
    }
    .modal-submit {
      background: var(--accent);
      color: #000;
      border: none;
      border-radius: 8px;
      padding: .5rem 1.25rem;
      font-weight: 800;
      cursor: pointer;
      font-family: inherit;
    }
    .modal-submit:disabled { opacity: .5; cursor: default; }
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
  theaterMode = false;
  editingTitle = false;
  titleDraft = '';
  vods: VodDto[] = [];
  schedules: StreamScheduleDto[] = [];
  emotes: EmoteDto[] = [];
  clipModalOpen = false;
  clipTitle = '';
  clipSaving = false;
  private viewerSub?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly streams: StreamService,
    readonly auth: AuthService,
    private readonly follows: FollowService,
    private readonly chat: ChatService,
    private readonly engagement: EngagementService,
    private readonly http: HttpClient,
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
      }
      this.viewerSub = this.chat.viewerCount$.subscribe((v) => {
        if (v > 0) this.displayViewers = v;
      });
      this.engagement.schedules(username).subscribe((s) => (this.schedules = s ?? []));
      this.engagement.emotes(username).subscribe((e) => (this.emotes = e ?? []));
    });
  }

  loadVods(): void {
    if (!this.channel) return;
    this.engagement.vods(this.channel.username, 0, 24).subscribe((p) => (this.vods = p.content ?? []));
  }

  toggleTheater(): void {
    this.theaterMode = !this.theaterMode;
  }

  share(): void {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => this.toastr.success('Link copied to clipboard!'));
    } else {
      this.toastr.info(url);
    }
  }

  startEditTitle(): void {
    if (!this.channel) return;
    this.titleDraft = this.channel.title;
    this.editingTitle = true;
  }

  saveTitle(): void {
    if (!this.channel || !this.titleDraft.trim()) return;
    this.streams.updateChannel(this.channel.username, { title: this.titleDraft.trim() }).subscribe({
      next: (updated) => {
        this.channel = updated as unknown as ChannelPublic;
        this.editingTitle = false;
        this.toastr.success('Title updated!');
      },
      error: () => this.toastr.error('Could not update title.')
    });
  }

  openClipModal(): void {
    this.clipTitle = '';
    this.clipSaving = false;
    this.clipModalOpen = true;
  }

  createClip(): void {
    if (!this.channel || !this.channel.currentStreamId || !this.clipTitle.trim()) return;
    this.clipSaving = true;
    const body = {
      streamId: this.channel.currentStreamId,
      title: this.clipTitle.trim(),
      clipUrl: this.hlsUrl || window.location.href,
      thumbnailUrl: this.channel.thumbnailUrl ?? null
    };
    this.http.post('/api/clips', body).subscribe({
      next: () => {
        this.clipModalOpen = false;
        this.clipSaving = false;
        this.toastr.success('Clip created!');
      },
      error: () => {
        this.clipSaving = false;
        this.toastr.error('Could not create clip.');
      }
    });
  }

  stubGift(): void {
    this.toastr.info('Gift subs coming soon!');
  }

  stubSub(): void {
    this.toastr.info('Channel subscriptions coming soon!');
  }

  toggleFollow(): void {
    if (!this.channel) return;
    const id = this.channel.id;
    if (this.isFollowing) {
      this.follows.unfollow(id).subscribe(() => (this.isFollowing = false));
    } else {
      this.follows.follow(id).subscribe(() => (this.isFollowing = true));
    }
  }

  fmt(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  }

  ngOnDestroy(): void {
    this.viewerSub?.unsubscribe();
  }
}
