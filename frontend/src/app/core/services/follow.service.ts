import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SpringPage } from '../models/spring-page';
import { ChannelPublic, LiveStream } from './stream.service';

@Injectable({ providedIn: 'root' })
export class FollowService {
  constructor(private readonly http: HttpClient) {}

  getFollowing(): Observable<ChannelPublic[]> {
    return this.http.get<ChannelPublic[]>('/api/follows/following');
  }

  getLiveFollowing(page = 0, size = 24): Observable<SpringPage<LiveStream>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<SpringPage<LiveStream>>('/api/follows/live', { params });
  }

  follow(channelId: string): Observable<void> {
    return this.http.post<void>(`/api/follows/${channelId}`, {});
  }

  unfollow(channelId: string): Observable<void> {
    return this.http.delete<void>(`/api/follows/${channelId}`);
  }
}
