import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SpringPage } from '../models/spring-page';

export interface PollOptionDto {
  id: string;
  title: string;
  voteCount: number | null;
}

export interface PollDto {
  id: string;
  title: string;
  status: string | null;
  options: PollOptionDto[];
}

export interface PredictionOptionDto {
  id: string;
  title: string;
  totalPoints: number | null;
}

export interface PredictionDto {
  id: string;
  title: string;
  status: string | null;
  lockAt: string | null;
  options: PredictionOptionDto[];
}

export interface ChannelPointBalance {
  id: string;
  points: number | null;
}

export interface ChannelPointRewardDto {
  id: string;
  title: string;
  cost: number | null;
  description: string | null;
}

export interface VodDto {
  id: string;
  title: string | null;
  vodUrl: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
}

@Injectable({ providedIn: 'root' })
export class EngagementService {
  constructor(private readonly http: HttpClient) {}

  polls(username: string): Observable<PollDto[]> {
    return this.http.get<PollDto[]>(`/api/channels/${encodeURIComponent(username)}/polls`);
  }

  createPoll(username: string, body: { title: string; durationSeconds?: number; optionTitles: string[] }): Observable<PollDto> {
    return this.http.post<PollDto>(`/api/channels/${encodeURIComponent(username)}/polls`, body);
  }

  votePoll(username: string, pollId: string, optionId: string): Observable<void> {
    return this.http.post<void>(`/api/channels/${encodeURIComponent(username)}/polls/${pollId}/vote`, { optionId });
  }

  endPoll(username: string, pollId: string): Observable<void> {
    return this.http.post<void>(`/api/channels/${encodeURIComponent(username)}/polls/${pollId}/end`, {});
  }

  predictions(username: string): Observable<PredictionDto[]> {
    return this.http.get<PredictionDto[]>(`/api/channels/${encodeURIComponent(username)}/predictions`);
  }

  createPrediction(
    username: string,
    body: { title: string; predictionWindow?: number; optionTitles: string[] }
  ): Observable<PredictionDto> {
    return this.http.post<PredictionDto>(`/api/channels/${encodeURIComponent(username)}/predictions`, body);
  }

  betPrediction(username: string, predictionId: string, body: { optionId: string; pointsWagered: number }): Observable<void> {
    return this.http.post<void>(`/api/channels/${encodeURIComponent(username)}/predictions/${predictionId}/bet`, body);
  }

  resolvePrediction(username: string, predictionId: string, winningOptionId: string): Observable<void> {
    return this.http.post<void>(
      `/api/channels/${encodeURIComponent(username)}/predictions/${predictionId}/resolve/${winningOptionId}`,
      {}
    );
  }

  cancelPrediction(username: string, predictionId: string): Observable<void> {
    return this.http.post<void>(`/api/channels/${encodeURIComponent(username)}/predictions/${predictionId}/cancel`, {});
  }

  pointBalance(username: string): Observable<ChannelPointBalance> {
    return this.http.get<ChannelPointBalance>(`/api/channels/${encodeURIComponent(username)}/points/balance`);
  }

  rewards(username: string): Observable<ChannelPointRewardDto[]> {
    return this.http.get<ChannelPointRewardDto[]>(`/api/channels/${encodeURIComponent(username)}/points/rewards`);
  }

  redeemReward(username: string, rewardId: string): Observable<unknown> {
    return this.http.post(`/api/channels/${encodeURIComponent(username)}/points/rewards/${rewardId}/redeem`, {});
  }

  vods(username: string, page = 0, size = 12): Observable<SpringPage<VodDto>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<SpringPage<VodDto>>(`/api/channels/${encodeURIComponent(username)}/vods`, { params });
  }

  donate(username: string, body: { amount: number; message?: string }): Observable<unknown> {
    return this.http.post(`/api/channels/${encodeURIComponent(username)}/donations`, body);
  }

  gifts(username: string, page = 0, size = 20): Observable<SpringPage<unknown>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<SpringPage<unknown>>(`/api/channels/${encodeURIComponent(username)}/gifts`, { params });
  }

  startRaid(username: string, body: { targetUsername: string; viewerCount: number }): Observable<unknown> {
    return this.http.post(`/api/channels/${encodeURIComponent(username)}/raids`, body);
  }

  completeRaid(username: string, raidId: string): Observable<unknown> {
    return this.http.post(`/api/channels/${encodeURIComponent(username)}/raids/${raidId}/complete`, {});
  }

  schedules(username: string): Observable<StreamScheduleDto[]> {
    return this.http.get<StreamScheduleDto[]>(`/api/channels/${encodeURIComponent(username)}/schedules`);
  }

  createSchedule(username: string, body: ScheduleCreateBody): Observable<StreamScheduleDto> {
    return this.http.post<StreamScheduleDto>(`/api/channels/${encodeURIComponent(username)}/schedules`, body);
  }

  cancelSchedule(username: string, scheduleId: string): Observable<void> {
    return this.http.delete<void>(`/api/channels/${encodeURIComponent(username)}/schedules/${scheduleId}`);
  }

  emotes(username: string): Observable<EmoteDto[]> {
    return this.http.get<EmoteDto[]>(`/api/channels/${encodeURIComponent(username)}/emotes`);
  }

  createEmote(username: string, body: Partial<EmoteDto>): Observable<EmoteDto> {
    return this.http.post<EmoteDto>(`/api/channels/${encodeURIComponent(username)}/emotes`, body);
  }

  deleteEmote(username: string, emoteId: string): Observable<void> {
    return this.http.delete<void>(`/api/channels/${encodeURIComponent(username)}/emotes/${emoteId}`);
  }
}

export interface StreamScheduleDto {
  id: string;
  title: string | null;
  scheduledAt: string;
  durationMinutes: number | null;
  isCancelled: boolean | null;
  category?: { id: string; name?: string; slug?: string } | null;
}

export interface ScheduleCreateBody {
  title?: string | null;
  scheduledAt: string;
  durationMinutes?: number | null;
  category?: { id: string } | null;
}

export interface EmoteDto {
  id: string;
  name: string;
  code: string;
  imageUrl: string;
  isSubscriberOnly?: boolean | null;
}
