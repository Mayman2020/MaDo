import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
import { loadStripe, Stripe, StripeCardElement } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'mado-channel-page',
  standalone: true,
  imports: [VideoPlayerComponent, ChatPanelComponent, ChannelEngagementComponent, DatePipe, FormsModule, DecimalPipe],
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
                <button type="button" class="subscribe" (click)="openSubModal()">Subscribe</button>
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

          <!-- Stats bar -->
          @if (channelStats) {
            <div class="stats-bar">
              <span class="sbar-item">👁 {{ channelStats.totalViews | number }} views</span>
              <span class="sbar-sep">·</span>
              <span class="sbar-item">⏱ {{ channelStats.totalHours | number:'1.0-0' }}h streamed</span>
              @if (channelRank) {
                <span class="sbar-sep">·</span>
                <span class="sbar-item">🏆 Rank #{{ channelRank }}</span>
              }
              @if (tierInfo) {
                <span class="sbar-sep">·</span>
                <span class="tier-badge-pill" [style.color]="tierInfo.badgeColor" [style.border-color]="tierInfo.badgeColor" title="{{ tierInfo.displayName }} streamer">
                  {{ tierIcon(tierInfo.name) }} {{ tierInfo.displayName }}
                </span>
              }
            </div>
          }

          <div class="tabs">
            <button type="button" [class.on]="tab === 'watch'" (click)="tab = 'watch'">Watch</button>
            <button type="button" [class.on]="tab === 'videos'" (click)="tab = 'videos'; loadVods()">Videos</button>
            <button type="button" [class.on]="tab === 'about'" (click)="tab = 'about'; loadAbout()">About</button>
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
          } @else if (tab === 'videos') {
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
          } @else if (tab === 'about') {
            <!-- Tier showcase -->
            @if (tierInfo) {
              <div class="about-tier mado-card" [style.border-color]="tierInfo.badgeColor">
                <span class="at-icon" [style.color]="tierInfo.badgeColor">{{ tierIcon(tierInfo.name) }}</span>
                <span class="at-name" [style.color]="tierInfo.badgeColor">{{ tierInfo.displayName }} Streamer</span>
                <span class="at-split">{{ tierInfo.revenueSplit }}% revenue split</span>
              </div>
            }

            <!-- Milestones showcase -->
            @if (earnedMilestones.length) {
              <div class="milestones-section">
                <h3 class="section-head">Achievements</h3>
                <div class="milestone-badges">
                  @for (m of earnedMilestones.slice(0, showAllMilestones ? 999 : 8); track m.id) {
                    <div class="ms-badge" [style.border-color]="m.milestone.badgeColor" title="{{ m.milestone.name }}: {{ m.milestone.description }}">
                      <span class="ms-icon">🏆</span>
                      <span class="ms-name">{{ m.milestone.name }}</span>
                    </div>
                  }
                </div>
                @if (!showAllMilestones && earnedMilestones.length > 8) {
                  <button type="button" class="show-more-btn" (click)="showAllMilestones = true">
                    View all {{ earnedMilestones.length }} achievements →
                  </button>
                }
              </div>
            }

            <!-- Community Goals -->
            @if (channelGoals.length) {
              <div class="goals-section">
                <h3 class="section-head">Community Goals</h3>
                <p class="muted goals-hint">Help {{ channel.username }} reach their goals by following or subscribing!</p>
                @for (g of channelGoals; track g.id) {
                  <div class="goal-card mado-card">
                    <div class="goal-head">
                      <span class="goal-type-dot" [style.background]="goalTypeColor(g.goalType)"></span>
                      <strong>{{ g.title }}</strong>
                      @if (g.rewardText) {
                        <span class="goal-reward-txt">🎁 {{ g.rewardText }}</span>
                      }
                    </div>
                    <div class="goal-prog-label">
                      <span>{{ g.currentValue | number }} / {{ g.targetValue | number }}</span>
                      <span>{{ goalPct(g) }}%</span>
                    </div>
                    <div class="goal-track">
                      <div class="goal-fill" [style.width]="goalPct(g) + '%'"></div>
                    </div>
                  </div>
                }
              </div>
            }
          }
        </section>

        <aside class="side">
          <mado-chat-panel [channelId]="channel.id" [channelUsername]="channel.username" />
        </aside>
      </div>
    }

    <!-- Subscribe modal -->
    @if (subModalOpen && channel) {
      <div class="modal-backdrop" (click)="closeSubModal()">
        <div class="modal sub-modal" (click)="$event.stopPropagation()">
          <div class="modal-head">Subscribe to {{ channel.username }}</div>
          <div class="sub-tiers">
            @for (t of subTiers; track t.tier) {
              <div class="sub-tier" [class.selected]="selectedTier === t.tier" (click)="selectedTier = t.tier">
                <div class="tier-name">{{ t.label }}</div>
                <div class="tier-price">&#36;{{ t.price.toFixed(2) }}/mo</div>
              </div>
            }
          </div>
          <div id="sub-card-element" class="stripe-card-el"></div>
          @if (subCardError) { <div class="card-error">{{ subCardError }}</div> }
          <div class="modal-actions">
            <button class="modal-cancel" (click)="closeSubModal()">Cancel</button>
            <button class="modal-submit" (click)="confirmSub()" [disabled]="subPurchasing">
              {{ subPurchasing ? 'Processing…' : 'Subscribe' }}
            </button>
          </div>
        </div>
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
    .sub-modal { min-width: 320px; }
    .sub-tiers { display: flex; gap: .75rem; margin-bottom: 1rem; }
    .sub-tier {
      flex: 1; padding: .75rem; border: 2px solid var(--border); border-radius: 10px;
      cursor: pointer; text-align: center; transition: border-color .15s;
    }
    .sub-tier:hover { border-color: var(--accent); }
    .sub-tier.selected { border-color: var(--accent); background: rgba(83,252,24,.07); }
    .tier-name { font-weight: 800; font-size: .9rem; }
    .tier-price { color: var(--accent); font-size: .85rem; margin-top: .2rem; }
    .stripe-card-el {
      background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 6px;
      padding: .75rem 1rem; margin-bottom: .75rem;
    }
    .card-error { color: #ff4444; font-size: .85rem; margin-bottom: .75rem; }

    /* Stats bar */
    .stats-bar {
      display: flex; flex-wrap: wrap; gap: .5rem; align-items: center;
      padding: .6rem 0; margin-bottom: .75rem; font-size: .88rem;
    }
    .sbar-item { color: var(--text-secondary); font-weight: 600; }
    .sbar-sep  { color: var(--text-muted); }
    .tier-badge-pill {
      border: 1px solid; border-radius: 8px; padding: .15rem .55rem;
      font-size: .78rem; font-weight: 800;
    }

    /* About tab */
    .about-tier {
      display: flex; align-items: center; gap: .75rem; padding: .85rem 1.1rem;
      margin-bottom: 1rem; border-width: 2px;
    }
    .at-icon { font-size: 1.4rem; }
    .at-name { font-weight: 800; font-size: 1rem; }
    .at-split { color: var(--text-muted); font-size: .85rem; margin-left: auto; }

    .section-head {
      font-size: .8rem; font-weight: 800; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: .06em; margin: 0 0 .65rem;
    }
    .milestones-section, .goals-section { margin-bottom: 1.25rem; }
    .milestone-badges { display: flex; flex-wrap: wrap; gap: .5rem; }
    .ms-badge {
      display: flex; flex-direction: column; align-items: center; gap: .2rem;
      border: 1.5px solid; border-radius: 10px; padding: .5rem .65rem;
      min-width: 70px; text-align: center; cursor: default;
      transition: transform .15s;
    }
    .ms-badge:hover { transform: translateY(-2px); }
    .ms-icon { font-size: 1.2rem; }
    .ms-name { font-size: .68rem; font-weight: 700; color: var(--text-secondary); }
    .show-more-btn {
      background: none; border: none; color: var(--accent); cursor: pointer;
      font-family: inherit; font-size: .85rem; font-weight: 700; margin-top: .65rem; padding: 0;
    }

    .goals-hint { font-size: .85rem; color: var(--text-muted); margin: 0 0 .75rem; }
    .goal-card { padding: .85rem 1rem; margin-bottom: .65rem; }
    .goal-head { display: flex; align-items: center; gap: .6rem; flex-wrap: wrap; margin-bottom: .65rem; }
    .goal-type-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .goal-reward-txt { font-size: .82rem; color: var(--text-muted); margin-left: auto; }
    .goal-prog-label { display: flex; justify-content: space-between; font-size: .8rem; color: var(--text-muted); margin-bottom: .3rem; }
    .goal-track { height: 7px; background: var(--bg-tertiary); border-radius: 999px; overflow: hidden; }
    .goal-fill { height: 100%; background: var(--accent); border-radius: 999px; transition: width .4s; }
  `]
})
export class ChannelPageComponent implements OnInit, OnDestroy {
  channel: ChannelPublic | null = null;
  hlsUrl = '';
  displayViewers = 0;
  isFollowing = false;
  canFollow = false;
  isOwner = false;
  tab: 'watch' | 'videos' | 'about' = 'watch';
  theaterMode = false;
  editingTitle = false;
  titleDraft = '';
  vods: VodDto[] = [];
  schedules: StreamScheduleDto[] = [];
  emotes: EmoteDto[] = [];
  clipModalOpen = false;
  clipTitle = '';
  clipSaving = false;
  // Incentive program data
  channelStats: any = null;
  channelRank: number | null = null;
  tierInfo: any = null;
  earnedMilestones: any[] = [];
  channelGoals: any[] = [];
  showAllMilestones = false;
  subModalOpen = false;
  selectedTier: 'TIER1' | 'TIER2' | 'TIER3' = 'TIER1';
  subPurchasing = false;
  subCardError = '';
  subTiers: { tier: 'TIER1' | 'TIER2' | 'TIER3'; label: string; price: number }[] = [];
  private stripe: Stripe | null = null;
  private subCardElement: StripeCardElement | null = null;
  private subClientSecret = '';
  private viewerSub?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly streams: StreamService,
    readonly auth: AuthService,
    private readonly follows: FollowService,
    private readonly chat: ChatService,
    private readonly engagement: EngagementService,
    private readonly http: HttpClient,
    private readonly toastr: ToastrService
  ) {}

  async ngOnInit(): Promise<void> {
    this.stripe = await loadStripe(environment.stripePublishableKey);
    const username = this.route.snapshot.paramMap.get('username') ?? '';
    this.streams.getChannel(username).subscribe({
      next: (ch) => {
      this.channel = ch;
      this.hlsUrl = ch.hlsMasterUrl ?? '';
      this.displayViewers = ch.viewerCount;
      this.subTiers = [
        { tier: 'TIER1', label: 'Tier 1', price: ch.subPriceTier1 ?? 4.99 },
        { tier: 'TIER2', label: 'Tier 2', price: ch.subPriceTier2 ?? 9.99 },
        { tier: 'TIER3', label: 'Tier 3', price: ch.subPriceTier3 ?? 24.99 }
      ];
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
      // Load incentive program data
      this.http.get<any>(`/api/stats/channel/${username}?period=ALL_TIME`).subscribe({
        next: (s) => (this.channelStats = s), error: () => {}
      });
      this.http.get<any>(`/api/rankings/channel/${username}`).subscribe({
        next: (r) => (this.channelRank = r?.ranks?.DAILY_VIEWS ?? null), error: () => {}
      });
      this.http.get<any>(`/api/tiers/${username}`).subscribe({
        next: (t) => (this.tierInfo = t), error: () => {}
      });
      },
      error: () => this.router.navigate(['/not-found'])
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
    if (!this.channel || !this.clipTitle.trim()) return;
    this.clipSaving = true;
    this.http
      .post('/api/clips/from-live-hls', {
        channelUsername: this.channel.username,
        title: this.clipTitle.trim()
      })
      .subscribe({
        next: () => {
          this.clipModalOpen = false;
          this.clipSaving = false;
          this.toastr.success('Clip created from the last 30 seconds of the stream.');
          void this.router.navigate(['/clips']);
        },
        error: (err) => {
          this.clipSaving = false;
          this.toastr.error(err?.error?.message ?? 'Could not create clip.');
        }
      });
  }

  stubGift(): void {
    this.toastr.info('Gift subs coming soon!');
  }

  openSubModal(): void {
    if (!this.channel?.isSubscriptionEnabled) {
      this.toastr.info('Subscriptions not enabled for this channel.');
      return;
    }
    this.subModalOpen = true;
    this.subCardError = '';
    this.subClientSecret = '';
    this.selectedTier = 'TIER1';
    setTimeout(() => this.mountSubCard(), 50);
    this.fetchSubIntent();
  }

  private fetchSubIntent(): void {
    if (!this.channel) return;
    this.http.post<{ clientSecret: string }>(`/api/subscriptions/${this.channel.id}`, { tier: this.selectedTier }).subscribe({
      next: r => { this.subClientSecret = r.clientSecret; },
      error: () => { this.subCardError = 'Failed to initialize payment.'; }
    });
  }

  private mountSubCard(): void {
    if (!this.stripe) return;
    const elements = this.stripe.elements();
    this.subCardElement = elements.create('card', {
      style: { base: { color: '#e0e0e0', fontFamily: 'monospace', fontSize: '15px', '::placeholder': { color: '#666' } } }
    });
    const el = document.getElementById('sub-card-element');
    if (el) this.subCardElement.mount(el);
  }

  async confirmSub(): Promise<void> {
    if (!this.stripe || !this.subCardElement || !this.subClientSecret) return;
    this.subPurchasing = true;
    this.subCardError = '';
    const result = await this.stripe.confirmCardPayment(this.subClientSecret, {
      payment_method: { card: this.subCardElement }
    });
    this.subPurchasing = false;
    if (result.error) {
      this.subCardError = result.error.message ?? 'Payment failed';
    } else if (result.paymentIntent?.status === 'succeeded') {
      this.closeSubModal();
      this.toastr.success(`Subscribed to ${this.channel?.username}!`);
    }
  }

  closeSubModal(): void {
    if (this.subCardElement) { this.subCardElement.unmount(); this.subCardElement = null; }
    this.subModalOpen = false;
    this.subClientSecret = '';
    this.subCardError = '';
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

  loadAbout(): void {
    if (!this.channel) return;
    const username = this.channel.username;
    if (!this.earnedMilestones.length) {
      this.http.get<any[]>(`/api/milestones/${username}`).subscribe({
        next: (m) => (this.earnedMilestones = m ?? []), error: () => {}
      });
    }
    if (!this.channelGoals.length) {
      this.http.get<any[]>(`/api/goals/${this.channel.id}`).subscribe({
        next: (g) => (this.channelGoals = g ?? []), error: () => {}
      });
    }
  }

  tierIcon(name: string): string {
    const m: Record<string, string> = { BRONZE:'🥉', SILVER:'🥈', GOLD:'🥇', DIAMOND:'💎', LEGEND:'👑' };
    return m[name] ?? '🏅';
  }

  goalPct(g: any): number {
    if (!g.targetValue) return 100;
    return Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
  }

  goalTypeColor(type: string): string {
    const m: Record<string, string> = {
      FOLLOWERS:'#53fc18', SUBSCRIBERS:'#9c27b0', HOURS:'#ff9800', VIEWERS:'#2196f3', DONATIONS:'#ffd700'
    };
    return m[type] ?? '#607d8b';
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
