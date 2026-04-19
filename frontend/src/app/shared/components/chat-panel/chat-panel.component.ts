import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, AfterViewChecked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ChatMessage, ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';

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
            <span class="name" [style.color]="m.color || 'var(--accent)'">{{ m.displayName }}</span>
            <span class="colon">: </span>
            <span class="text">{{ m.content }}</span>
          </div>
        }
        @if (pauseScroll && messages.length > 0) {
          <div class="scroll-hint" (click)="pauseScroll = false; scrollToBottom()">
            ↓ Scroll to bottom
          </div>
        }
      </div>

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
  `]
})
export class ChatPanelComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input({ required: true }) channelId!: string;
  @ViewChild('viewport') viewportRef!: ElementRef<HTMLDivElement>;

  messages: ChatMessage[] = [];
  draft = '';
  pauseScroll = false;

  private msgSub?: Subscription;
  private needsScroll = false;
  private readonly MAX_MESSAGES = 200;

  constructor(
    readonly auth: AuthService,
    private readonly chat: ChatService,
    private readonly http: HttpClient
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
  }

  ngAfterViewChecked(): void {
    if (this.needsScroll) {
      this.scrollToBottom();
      this.needsScroll = false;
    }
  }

  ngOnDestroy(): void {
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
