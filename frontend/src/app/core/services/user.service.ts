import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from './auth.service';

/** Matches backend `UserResponse` (public profile + email for self). */
export interface UserPublicDto {
  id: string;
  username: string;
  email?: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: User['role'];
  isVerified: boolean | null;
}

export interface UserPreferencesDto {
  id?: string;
  emailOnLive?: boolean | null;
  emailOnFollow?: boolean | null;
  emailOnSub?: boolean | null;
  pushOnLive?: boolean | null;
  chatColor?: string | null;
  darkMode?: boolean | null;
  autoplay?: boolean | null;
  defaultQuality?: string | null;
  language?: string | null;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private readonly http: HttpClient) {}

  me(): Observable<User> {
    return this.http.get<User>('/api/me');
  }

  getPreferences(): Observable<UserPreferencesDto> {
    return this.http.get<UserPreferencesDto>('/api/me/preferences');
  }

  patchPreferences(patch: UserPreferencesDto): Observable<UserPreferencesDto> {
    return this.http.patch<UserPreferencesDto>('/api/me/preferences', patch);
  }

  getByUsername(username: string): Observable<UserPublicDto> {
    return this.http.get<UserPublicDto>(`/api/users/${encodeURIComponent(username)}`);
  }

  patchProfile(username: string, body: { displayName?: string; bio?: string }): Observable<UserPublicDto> {
    return this.http.patch<UserPublicDto>(`/api/users/${encodeURIComponent(username)}`, body);
  }
}
