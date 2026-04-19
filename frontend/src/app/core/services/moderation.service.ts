import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface BanRow {
  id: string;
  reason: string | null;
  isPermanent: boolean | null;
  isTimeout: boolean | null;
  createdAt?: string;
}

export interface BannedWordRow {
  id: string;
  word: string;
}

export interface ModeratorRow {
  id: string;
  user?: { id: string; username: string };
}

@Injectable({ providedIn: 'root' })
export class ModerationService {
  constructor(private readonly http: HttpClient) {}

  listBans(channelUsername: string): Observable<BanRow[]> {
    return this.http.get<BanRow[]>(`/api/channels/${encodeURIComponent(channelUsername)}/moderation/bans`);
  }

  ban(channelUsername: string, body: { targetUsername: string; reason?: string; permanent?: boolean; timeoutMinutes?: number }): Observable<unknown> {
    return this.http.post(`/api/channels/${encodeURIComponent(channelUsername)}/moderation/bans`, body);
  }

  unban(channelUsername: string, banId: string): Observable<void> {
    return this.http.delete<void>(`/api/channels/${encodeURIComponent(channelUsername)}/moderation/bans/${banId}`);
  }

  listMods(channelUsername: string): Observable<ModeratorRow[]> {
    return this.http.get<ModeratorRow[]>(`/api/channels/${encodeURIComponent(channelUsername)}/moderation/moderators`);
  }

  addMod(channelUsername: string, userId: string): Observable<void> {
    return this.http.post<void>(`/api/channels/${encodeURIComponent(channelUsername)}/moderation/moderators`, { userId });
  }

  removeMod(channelUsername: string, userId: string): Observable<void> {
    return this.http.delete<void>(`/api/channels/${encodeURIComponent(channelUsername)}/moderation/moderators/${userId}`);
  }

  listWords(channelUsername: string): Observable<BannedWordRow[]> {
    return this.http.get<BannedWordRow[]>(`/api/channels/${encodeURIComponent(channelUsername)}/moderation/banned-words`);
  }

  addWord(channelUsername: string, word: string): Observable<unknown> {
    return this.http.post(`/api/channels/${encodeURIComponent(channelUsername)}/moderation/banned-words`, { word });
  }

  removeWord(channelUsername: string, wordId: string): Observable<void> {
    return this.http.delete<void>(`/api/channels/${encodeURIComponent(channelUsername)}/moderation/banned-words/${wordId}`);
  }
}
