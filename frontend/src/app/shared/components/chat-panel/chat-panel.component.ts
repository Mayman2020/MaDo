import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, AfterViewChecked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ChatMessage, ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { EngagementService } from '../../../core/services/engagement.service';
import { Subscription } from 'rxjs';

interface PollState {
  id: string;
  title: string;
  status: string;
  totalVotes: number;
  options: { id: string; title: string; voteCount: number }[];
}

interface PredictionState {
  id: string;
  title: string;
  status: string;
  winningOptionId?: string;
  options: { id: string; title: string; totalPoints: number; participantCount: number }[];
}

interface RaidEvent {
  raidId: string;
  fromUsername: string;
  viewerCount: number;
}

@Component({
  selector: 'mado-chat-panel',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="chat mado-card">
      <div class="head">
        <span class="head-title">LIVE CHAT</span>
        <span class="head-count">{{ messages.length }}</span>
      </div>

      <div
        class="viewport"
        #viewport
        (mouseenter)="pauseScroll = true"
        (mouseleave)="pauseScroll = false; scrollToBottom()"
      >
        @if (messages.length === 0) {
          <p class="empty-chat">Be the first to say something!</p>
        }
        @for (m of messages; track m.id) {
          <div class="line">
            <span class="badges">
              @for (b of (m.badges ?? []); track b) {
                @if (b === 'streamer') {
                  <span class="badge badge-streamer" title="Streamer">🎙</span>
                } @else if (b === 'mod') {
                  <span class="badge badge-mod" title="Moderator">🛡</span>
                } @else if (b === 'sub') {
                  <span class="badge badge-sub" title="Subscriber">⭐</span>
                }
              }
            </span>
            <span class="name" [style.color]="m.color || 'var(--accent)'" [textContent]="m.displayName"></span>
            <span class="colon">: </span>
            <span class="text" [textContent]="m.content"></span>
          </div>
        }
        @if (pauseScroll && messages.length > 0) {
          <div class="scroll-hint" (click)="pauseScroll = false; scrollToBottom()">
            ↓ Scroll to bottom
          </div>
        }
      </div>

      @if (incomingRaid) {
        <div class="raid-banner">
          <span class="raid-icon">⚔️</span>
          <strong [textContent]="incomingRaid.fromUsername"></strong> is raiding with {{ incomingRaid.viewerCount }} viewers!
        </div>
      }

      @if (activePoll?.status === 'ACTIVE') {
        <div class="poll-overlay">
          <div class="poll-title">📊 {{ activePoll!.title }}</div>
          @for (o of activePoll!.options; track o.id) {
            <button class="poll-opt" (click)="votePoll(activePoll!.id, o.id)">
              {{ o.title }}
              @if (activePoll!.totalVotes > 0) {
                <span class="poll-pct">{{ ((o.voteCount / activePoll!.totalVotes) * 100).toFixed(0) }}%</span>
              }
            </button>
          }
          <div class="poll-total">{{ activePoll!.totalVotes }} votes</div>
        </div>
      }

      @if (activePrediction) {
        <div class="pred-overlay">
          <div class="pred-title">🔮 {{ activePrediction!.title }}</div>
          <div class="pred-status-badge" [class.active]="activePrediction!.status === 'ACTIVE'" [class.resolved]="activePrediction!.status === 'RESOLVED'">
            {{ activePrediction!.status }}
          </div>
          @if (activePrediction!.status === 'ACTIVE') {
            @for (o of activePrediction!.options; track o.id) {
              <button class="pred-opt" (click)="betOnPrediction(activePrediction!.id, o.id)">
                {{ o.title }}
                <span class="pred-pts">{{ o.totalPoints }} pts · {{ o.participantCount }} bets</span>
              </button>
            }
          } @else if (activePrediction!.status === 'RESOLVED') {
            @for (o of activePrediction!.options; track o.id) {
              <div class="pred-result" [class.winner]="o.id === activePrediction!.winningOptionId">
                {{ o.title }} @if (o.id === activePrediction!.winningOptionId) { ✅ }
              </div>
            }
          }
        </div>
      }

      @if (auth.getAccessToken()) {
        <div class="send">
          <div class="input-wrap">
            <input
              [(ngModel)]="draft"
              (keydown.enter)="send()"
              placeholder="Send a message…"
              maxlength="500"
              [class.near-limit]="draft.length > 450"
            />
            @if (draft.length > 400) {
              <span class="char-count" [class.over]="draft.length > 480">{{ 500 - draft.length }}</span>
            }
          </div>
          <button type="button" (click)="send()" [disabled]="!draft.trim()">Chat</button>
        </div>
      } @else {
        <div class="hint">
          <a href="/login">Log in</a> to chat
        </div>
      }
    </div>
  `,
  styles: [`
    .chat {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 460px;
      max-height: calc(100vh - 120px);
      border-radius: 12px;
      overflow: hidden;
    }
    .head {
      padding: .65rem 1rem;
      font-weight: 800;
      font-size: .78rem;
      letter-spacing: .06em;
      text-transform: uppercase;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    .head-title { color: var(--text-primary); }
    .head-count {
      font-size: .7rem;
      color: var(--text-muted);
      background: var(--bg-tertiary);
      padding: .1rem .45rem;
      border-radius: 999px;
    }
    .viewport {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: .25rem 0;
      position: relative;
      scroll-behavior: smooth;
    }
    .viewport::-webkit-scrollbar { width: 4px; }
    .viewport::-webkit-scrollbar-thumb { background: var(--bg-hover); border-radius: 4px; }
    .empty-chat {
      color: var(--text-muted);
      font-size: .82rem;
      text-align: center;
      padding: 1.5rem 1rem;
      margin: 0;
    }
    .line {
      padding: .3rem 1rem;
      font-size: .875rem;
      line-height: 1.45;
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: .1rem;
    }
    .line:hover { background: rgba(255,255,255,.03); }
    .badges { display: inline-flex; align-items: center; gap: .12rem; margin-right: .2rem; }
    .badge {
      font-size: .8rem;
      line-height: 1;
      display: inline-block;
    }
    .badge-streamer { filter: drop-shadow(0 0 4px #53fc18); }
    .badge-mod { filter: drop-shadow(0 0 3px #00b0ff); }
    .badge-sub { filter: drop-shadow(0 0 3px #ffd700); }
    .name { font-weight: 700; cursor: default; }
    .colon { color: var(--text-muted); }
    .text { color: var(--text-primary); word-break: break-word; }
    .scroll-hint {
      position: sticky;
      bottom: 0;
      width: 100%;
      text-align: center;
      padding: .35rem;
      background: rgba(83, 252, 24, 0.12);
      color: var(--accent);
      font-size: .78rem;
      font-weight: 700;
      cursor: pointer;
      letter-spacing: .03em;
    }
    .scroll-hint:hover { background: rgba(83, 252, 24, 0.22); }
    .send {
      display: flex;
      gap: .5rem;
      padding: .6rem .75rem;
      border-top: 1px solid var(--border);
      flex-shrink: 0;
      align-items: flex-end;
    }
    .input-wrap {
      flex: 1;
      position: relative;
    }
    .input-wrap input {
      width: 100%;
      box-sizing: border-box;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text-primary);
      padding: .5rem .75rem;
      font-family: inherit;
      font-size: .875rem;
      outline: none;
      transition: border-color .15s;
    }
    .input-wrap input:focus { border-color: var(--accent); }
    .input-wrap input.near-limit { border-color: #ff9800; }
    .char-count {
      position: absolute;
      right: .5rem;
      bottom: .35rem;
      font-size: .68rem;
      color: var(--text-muted);
      pointer-events: none;
    }
    .char-count.over { color: #f44336; }
    .send button {
      background: var(--accent);
      color: #000;
      font-weight: 800;
      font-size: .82rem;
      border: none;
      border-radius: 8px;
      padding: .5rem 1rem;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
      transition: filter .15s;
    }
    .send button:hover:not(:disabled) { filter: brightness(1.1); }
    .send button:disabled { opacity: .45; cursor: default; }
    .hint {
      padding: .75rem;
      color: var(--text-muted);
      font-size: .85rem;
      text-align: center;
      border-top: 1px solid var(--border);
      flex-shrink: 0;
    }
    .hint a { color: var(--accent); text-decoration: none; }
    .hint a:hover { text-decoration: underline; }
    .raid-banner {
      padding: .6rem .75rem; background: rgba(229,57,53,.15); border-top: 2px solid #e53935;
      color: #e57373; font-size: .82rem; font-weight: 700; flex-shrink: 0;
      animation: raidPulse 1s ease-in-out infinite alternate;
    }
    .raid-icon { margin-right: .3rem; }
    @keyframes raidPulse { from { background: rgba(229,57,53,.1); } to { background: rgba(229,57,53,.25); } }
    .poll-overlay {
      padding: .6rem .75rem; border-top: 1px solid var(--border);
      background: rgba(83,252,24,.04); flex-shrink: 0;
    }
    .poll-title { font-weight: 800; font-size: .82rem; margin-bottom: .4rem; }
    .poll-opt {
      display: flex; justify-content: space-between; width: 100%; background: var(--bg-tertiary);
      border: 1px solid var(--border); color: var(--text-primary); border-radius: 6px;
      padding: .3rem .6rem; margin-bottom: .3rem; cursor: pointer; font-size: .8rem; font-weight: 600;
    }
    .poll-opt:hover { border-color: var(--accent); }
    .poll-pct { color: var(--accent); }
    .poll-total { font-size: .72rem; color: var(--text-muted); text-align: right; }
    .pred-overlay {
      padding: .6rem .75rem; border-top: 1px solid var(--border);
      background: rgba(128,0,255,.04); flex-shrink: 0;
    }
    .pred-title { font-weight: 800; font-size: .82rem; margin-bottom: .25rem; }
    .pred-status-badge {
      display: inline-block; font-size: .65rem; font-weight: 900; padding: .1rem .4rem;
      border-radius: 4px; margin-bottom: .4rem; letter-spacing: .05em;
      background: var(--bg-tertiary); color: var(--text-muted);
    }
    .pred-status-badge.active { background: rgba(83,252,24,.15); color: var(--accent); }
    .pred-status-badge.resolved { background: rgba(0,191,255,.1); color: #00bfff; }
    .pred-opt {
      display: flex; justify-content: space-between; width: 100%; background: var(--bg-tertiary);
      border: 1px solid var(--border); color: var(--text-primary); border-radius: 6px;
      padding: .3rem .6rem; margin-bottom: .3rem; cursor: pointer; font-size: .8rem;
    }
    .pred-opt:hover { border-color: #9b59b6; }
    .pred-pts { color: var(--text-muted); font-size: .72rem; }
    .pred-result {
      padding: .25rem .5rem; font-size: .8rem; border-radius: 6px;
      margin-bottom: .2rem; background: var(--bg-tertiary);
    }
    .pred-result.winner { background: rgba(83,252,24,.12); color: var(--accent); font-weight: 800; }
  `]
})
export class ChatPanelComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input({ required: true }) channelId!: string;
  @Input() channelUsername = '';
  @ViewChild('viewport') viewportRef!: ElementRef<HTMLDivElement>;

  messages: ChatMessage[] = [];
  draft = '';
  pauseScroll = false;
  activePoll: PollState | null = null;
  activePrediction: PredictionState | null = null;
  incomingRaid: RaidEvent | null = null;

  private msgSub?: Subscription;
  private needsScroll = false;
  private readonly MAX_MESSAGES = 200;
  private pollSub?: { unsubscribe(): void };
  private predSub?: { unsubscribe(): void };
  private raidSub?: { unsubscribe(): void };

  constructor(
    readonly auth: AuthService,
    private readonly chat: ChatService,
    private readonly http: HttpClient,
    private readonly engagement: EngagementService
  ) {}

  ngOnInit(): void {
    this.http.get<ChatMessage[]>(`/api/channels/${this.channelId}/messages?limit=80`).subscribe({
      next: (rows) => {
        this.messages = rows ?? [];
        this.needsScroll = true;
      }
    });
    this.chat.connect(this.channelId);
    this.msgSub = this.chat.messages$.subscribe((m) => {
      this.messages.push(m);
      if (this.messages.length > this.MAX_MESSAGES) {
        this.messages.splice(0, this.messages.length - this.MAX_MESSAGES);
      }
      if (!this.pauseScroll) {
        this.needsScroll = true;
      }
    });

    // Wait for STOMP to connect then subscribe to polls/predictions
    const waitForClient = () => {
      if (this.chat['client']?.connected) {
        this.pollSub = this.chat['client'].subscribe(
          `/topic/channel.${this.channelId}.polls`,
          msg => { this.activePoll = JSON.parse(msg.body); }
        );
        this.predSub = this.chat['client'].subscribe(
          `/topic/channel.${this.channelId}.predictions`,
          msg => { this.activePrediction = JSON.parse(msg.body); }
        );
        this.raidSub = this.chat['client'].subscribe(
          `/topic/channel.${this.channelId}.raid`,
          msg => {
            this.incomingRaid = JSON.parse(msg.body);
            setTimeout(() => { this.incomingRaid = null; }, 8000);
          }
        );
      } else {
        setTimeout(waitForClient, 500);
      }
    };
    setTimeout(waitForClient, 1000);
  }

  ngAfterViewChecked(): void {
    if (this.needsScroll) {
      this.scrollToBottom();
      this.needsScroll = false;
    }
  }

  votePoll(pollId: string, optionId: string): void {
    if (!this.channelUsername || !this.auth.currentUser$.value) return;
    this.engagement.votePoll(this.channelUsername, pollId, optionId).subscribe();
  }

  betOnPrediction(predictionId: string, optionId: string): void {
    if (!this.channelUsername || !this.auth.currentUser$.value) return;
    this.engagement.betPrediction(this.channelUsername, predictionId, { optionId, pointsWagered: 100 }).subscribe();
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
    this.predSub?.unsubscribe();
    this.raidSub?.unsubscribe();
    this.msgSub?.unsubscribe();
    this.chat.disconnect();
  }

  scrollToBottom(): void {
    const el = this.viewportRef?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }

  send(): void {
    const t = this.draft.trim();
    if (!t) return;
    this.chat.sendMessage(this.channelId, t);
    this.draft = '';
  }
}
