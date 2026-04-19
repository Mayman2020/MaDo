import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

/** Mirrors backend Subscription JSON (channel may be nested). */
export interface MySubscription {
  id: string;
  tier: string | null;
  isActive: boolean | null;
  expiresAt: string;
  channel?: { id: string; title: string | null; user?: { username: string } };
}

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  constructor(private readonly http: HttpClient) {}

  mySubscriptions(): Observable<MySubscription[]> {
    return this.http.get<MySubscription[]>('/api/subscriptions/me');
  }
}
