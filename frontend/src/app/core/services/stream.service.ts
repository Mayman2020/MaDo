import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';

export interface LiveStream {
  channelId: string;
  username: string;
  title: string;
  thumbnailUrl: string | null;
  viewerCount: number;
  categorySlug: string | null;
  streamId: string | null;
  hlsMasterUrl: string;
}

export interface ChannelPublic {
  id: string;
  username: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  isLive: boolean;
  viewerCount: number;
  categorySlug: string | null;
  categoryName: string | null;
  streamKey: string;
  hlsMasterUrl: string | null;
  /** Present when channel is live — for analytics API. */
  currentStreamId?: string | null;
}

export interface ChannelStatsResponse {
  followerCount: number;
  subscriberCount: number;
  totalViews: number;
  peakViewerCount: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  thumbnailUrl: string | null;
  viewerCount: number;
}

type LivePage = { content: LiveStream[]; totalElements: number };
type CatPage = { content: Category[] };

@Injectable({ providedIn: 'root' })
export class StreamService {
  private readonly ttlMs = 14_000;
  private liveCache = new Map<string, { at: number; data: LivePage }>();
  private catCache = new Map<string, { at: number; data: CatPage }>();

  constructor(private readonly http: HttpClient) {}

  /** Clears short-lived discovery cache (e.g. after going live from dashboard). */
  invalidateDiscoveryCache(): void {
    this.liveCache.clear();
    this.catCache.clear();
  }

  getLiveStreams(page = 0, size = 24): Observable<LivePage> {
    const key = `${page}:${size}`;
    const hit = this.liveCache.get(key);
    const now = Date.now();
    if (hit && now - hit.at < this.ttlMs) {
      return of(hit.data);
    }
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<LivePage>('/api/streams/live', { params }).pipe(
      tap((data) => this.liveCache.set(key, { at: Date.now(), data }))
    );
  }

  getChannel(username: string): Observable<ChannelPublic> {
    return this.http.get<ChannelPublic>(`/api/channels/${encodeURIComponent(username)}`);
  }

  updateChannel(username: string, body: Partial<{ title: string; description: string; categorySlug: string }>): Observable<ChannelPublic> {
    return this.http.patch<ChannelPublic>(`/api/channels/${encodeURIComponent(username)}`, body);
  }

  getChannelStats(username: string): Observable<ChannelStatsResponse> {
    return this.http.get<ChannelStatsResponse>(`/api/channels/${encodeURIComponent(username)}/stats`);
  }

  resetStreamKey(username: string): Observable<{ streamKey: string }> {
    return this.http.post<{ streamKey: string }>(`/api/channels/${encodeURIComponent(username)}/reset-key`, {});
  }

  getCategories(page = 0, size = 50): Observable<CatPage> {
    const key = `${page}:${size}`;
    const hit = this.catCache.get(key);
    const now = Date.now();
    if (hit && now - hit.at < this.ttlMs) {
      return of(hit.data);
    }
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<CatPage>('/api/categories', { params }).pipe(
      tap((data) => this.catCache.set(key, { at: Date.now(), data }))
    );
  }

  getLiveByCategory(slug: string, page = 0, size = 24): Observable<{ content: LiveStream[] }> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<{ content: LiveStream[] }>(`/api/categories/${encodeURIComponent(slug)}/streams`, { params });
  }

  search(
    q: string,
    type: 'channel' | 'category' | 'clip' = 'channel'
  ): Observable<{ channels: ChannelPublic[]; clips: unknown[]; categories: CategorySearchHit[] }> {
    const params = new HttpParams().set('q', q).set('type', type);
    return this.http.get<{ channels: ChannelPublic[]; clips: unknown[]; categories: CategorySearchHit[] }>('/api/search', { params });
  }
}

export interface CategorySearchHit {
  id: string;
  name: string;
  slug: string;
  thumbnailUrl: string | null;
  viewerCount: number;
}
