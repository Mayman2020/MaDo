import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ChatMessage, ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'mado-chat-panel',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="chat mado-card">
      <div class="head">Chat</div>
      <div class="viewport">
        @for (m of messages; track m.id) {
          <div class="line">
            <span class="name" [style.color]="m.color || 'var(--accent)'">{{ m.displayName }}</span>
            <span class="text">{{ m.content }}</span>
          </div>
        }
      </div>
      @if (auth.getAccessToken()) {
        <div class="send">
          <input [(ngModel)]="draft" (keydown.enter)="send()" placeholder="Send a message..." maxlength="500" />
          <button type="button" (click)="send()">Chat</button>
        </div>
      } @else {
        <div class="hint">Log in to chat</div>
      }
    </div>
  `,
  styles: [`
    .chat { display: flex; flex-direction: column; height: 420px; }
    .head { padding: .75rem 1rem; font-weight: 700; border-bottom: 1px solid var(--border); }
    .viewport { flex: 1; min-height: 0; overflow-y: auto; }
    .line { padding: .35rem 1rem; font-size: .9rem; }
    .name { font-weight: 700; margin-right: .35rem; }
    .send { display: flex; gap: .5rem; padding: .5rem; border-top: 1px solid var(--border); }
    .send input { flex: 1; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); padding: .5rem .75rem; }
    .send button { background: var(--accent); color: #000; font-weight: 700; border: none; border-radius: 8px; padding: 0 1rem; cursor: pointer; }
    .hint { padding: .75rem; color: var(--text-secondary); font-size: .85rem; }
  `]
})
export class ChatPanelComponent implements OnInit, OnDestroy {
  @Input({ required: true }) channelId!: string;

  messages: ChatMessage[] = [];
  draft = '';

  constructor(
    readonly auth: AuthService,
    private readonly chat: ChatService,
    private readonly http: HttpClient
  ) {}

  ngOnInit(): void {
    this.http.get<ChatMessage[]>(`/api/channels/${this.channelId}/messages?limit=80`).subscribe((rows) => {
      this.messages = [...(rows ?? [])];
    });
    this.chat.connect(this.channelId);
    this.chat.messages$.subscribe((m) => this.messages.push(m));
  }

  ngOnDestroy(): void {
    this.chat.disconnect();
  }

  send(): void {
    const t = this.draft.trim();
    if (!t) {
      return;
    }
    this.chat.sendMessage(this.channelId, t);
    this.draft = '';
  }
}
