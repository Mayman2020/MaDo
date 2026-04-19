import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SpringPage } from '../models/spring-page';

export interface AppNotification {
  id: string;
  type: string;
  title: string | null;
  message: string | null;
  /** Backend may serialize as `read` (Jackson) or `isRead`. */
  isRead?: boolean | null;
  read?: boolean | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private readonly http: HttpClient) {}

  list(page = 0, size = 30): Observable<SpringPage<AppNotification>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<SpringPage<AppNotification>>('/api/notifications', { params });
  }

  markRead(id: string): Observable<void> {
    return this.http.post<void>(`/api/notifications/${id}/read`, {});
  }

  markAllRead(): Observable<void> {
    return this.http.post<void>('/api/notifications/read-all', {});
  }
}
