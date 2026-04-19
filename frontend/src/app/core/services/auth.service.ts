import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: 'VIEWER' | 'STREAMER' | 'MODERATOR' | 'ADMIN';
  isVerified: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = '/api/auth';
  currentUser$ = new BehaviorSubject<User | null>(null);
  isLoggedIn$ = this.currentUser$.pipe(map((user) => !!user));
  isStreamer$ = this.currentUser$.pipe(map((user) => user?.role === 'STREAMER' || user?.role === 'ADMIN'));

  constructor(private readonly http: HttpClient) {
    const user = localStorage.getItem('mado_user');
    if (user) {
      this.currentUser$.next(JSON.parse(user) as User);
    }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((response) => this.setSession(response))
    );
  }

  register(data: { username: string; email: string; password: string; displayName?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap((response) => this.setSession(response))
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('mado_refresh_token');
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap((response) => this.setSession(response))
    );
  }

  /** Updates cached user after profile edits (no token change). */
  updateLocalUser(user: User): void {
    localStorage.setItem('mado_user', JSON.stringify(user));
    this.currentUser$.next(user);
  }

  logout(): void {
    const refreshToken = localStorage.getItem('mado_refresh_token');
    if (refreshToken) {
      this.http.post<void>(`${this.apiUrl}/logout`, { refreshToken }).subscribe({ error: () => undefined });
    }
    localStorage.removeItem('mado_access_token');
    localStorage.removeItem('mado_refresh_token');
    localStorage.removeItem('mado_user');
    this.currentUser$.next(null);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('mado_access_token');
  }

  private setSession(response: AuthResponse): void {
    localStorage.setItem('mado_access_token', response.accessToken);
    localStorage.setItem('mado_refresh_token', response.refreshToken);
    localStorage.setItem('mado_user', JSON.stringify(response.user));
    this.currentUser$.next(response.user);
  }
}
