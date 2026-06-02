import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { resolveApiBaseUrl } from '../../../environments/api-url';
import { AuthService } from './auth.service';

export interface ChatMessage {
  id: string;
  username: string;
  displayName: string;
  content: string;
  createdAt: string;
  color: string | null;
  badges: string[] | null;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private client: Client | null = null;
  private currentChannelId: string | null = null;

  private readonly messagesSubject = new Subject<ChatMessage>();
  readonly messages$ = this.messagesSubject.asObservable();

  private readonly viewerCountSubject = new BehaviorSubject<number>(0);
  readonly viewerCount$ = this.viewerCountSubject.asObservable();

  constructor(private readonly auth: AuthService) {}

  connect(channelId: string): void {
    this.disconnect();
    this.currentChannelId = channelId;
    const token = this.auth.getAccessToken();
    const base = resolveApiBaseUrl().replace(/\/$/, '');
    const sockUrl = base ? `${base}/ws` : '/ws';

    this.client = new Client({
      webSocketFactory: () => new SockJS(sockUrl) as unknown as WebSocket,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000
    });

    this.client.onConnect = () => {
      if (!this.client) return;

      this.client.subscribe(`/topic/channel.${channelId}.messages`, (msg: IMessage) => {
        this.messagesSubject.next(JSON.parse(msg.body) as ChatMessage);
      });

      this.client.subscribe(`/topic/channel.${channelId}.viewers`, (msg: IMessage) => {
        const body = JSON.parse(msg.body) as { viewerCount: number };
        this.viewerCountSubject.next(body.viewerCount);
      });

      // Notify backend this viewer joined
      this.client.publish({ destination: `/app/channel/${channelId}/join`, body: '{}' });
    };

    this.client.activate();
  }

  disconnect(): void {
    if (this.client) {
      if (this.client.connected && this.currentChannelId) {
        this.client.publish({ destination: `/app/channel/${this.currentChannelId}/leave`, body: '{}' });
      }
      this.client.deactivate();
      this.client = null;
    }
    this.currentChannelId = null;
    this.viewerCountSubject.next(0);
  }

  sendMessage(channelId: string, content: string): void {
    const token = this.auth.getAccessToken();
    if (!this.client?.connected || !token) return;
    this.client.publish({
      destination: `/app/chat/${channelId}`,
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content })
    });
  }
}
