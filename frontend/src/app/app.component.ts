import { AsyncPipe } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, Subscription, switchMap, of, forkJoin, map, catchError, distinctUntilChanged, timeout } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { FollowService } from './core/services/follow.service';
import { LiveStream, StreamService } from './core/services/stream.service';

@Component({
  selector: 'mado-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <a routerLink="/" class="logo mado-heading">MaDo Live</a>
        <nav class="primary">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"><span class="nav-ic" aria-hidden="true">⌂</span> Home</a>
          <a routerLink="/browse" routerLinkActive="active"><span class="nav-ic" aria-hidden="true">▢</span> Browse</a>
          <a routerLink="/leaderboard" routerLinkActive="active"><span class="nav-ic" aria-hidden="true">🏆</span> Leaderboard</a>
          @if (auth.isLoggedIn$ | async) {
            <a routerLink="/following" routerLinkActive="active"><span class="nav-ic" aria-hidden="true">♥</span> Following</a>
            <a routerLink="/subscriptions" routerLinkActive="active">Subs</a>
            <a routerLink="/notifications" routerLinkActive="active">Alerts</a>
          }
          <a routerLink="/clips" routerLinkActive="active">Clips</a>
          @if (auth.isStreamer$ | async) {
            <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
          }
          @if (auth.isLoggedIn$ | async) {
            <a routerLink="/settings/profile" routerLinkActive="active">Settings</a>
          }
        </nav>

        @if (auth.isLoggedIn$ | async) {
          <div class="side-section">
            <div class="side-h">Following — live</div>
            <div class="side-scroll" [class.expanded]="followingExpanded">
              @if (liveFollowing.length === 0) {
                <p class="side-empty">No one you follow is live.</p>
              }
              @for (s of liveFollowing; track s.channelId) {
                <a class="side-item" [routerLink]="['/', s.username]">
                  <div class="side-av">
                    {{ s.username.charAt(0).toUpperCase() }}
                    <span class="av-live-dot"></span>
                  </div>
                  <div class="side-txt">
                    <span class="side-name">{{ s.username }}</span>
                    <span class="side-sub">{{ catLabel(s) }}</span>
                  </div>
                  <span class="side-n">{{ fmt(s.viewerCount) }}</span>
                </a>
              }
            </div>
            @if (liveFollowing.length > 4) {
              <button type="button" class="show-more-side" (click)="followingExpanded = !followingExpanded">
                {{ followingExpanded ? 'Show less' : 'Show more' }}
              </button>
            }
          </div>
        }
        @if (recommended.length) {
          <div class="side-section">
            <div class="side-h">Recommended</div>
            <div class="side-scroll" [class.expanded]="recommendedExpanded">
              @for (s of recommended; track s.channelId) {
                <a class="side-item" [routerLink]="['/', s.username]">
                  <div class="side-av">
                    {{ s.username.charAt(0).toUpperCase() }}
                    <span class="av-live-dot"></span>
                  </div>
                  <div class="side-txt">
                    <span class="side-name">{{ s.username }}</span>
                    <span class="side-sub">{{ catLabel(s) }}</span>
                  </div>
                  <span class="side-n">{{ fmt(s.viewerCount) }}</span>
                </a>
              }
            </div>
            @if (recommended.length > 4) {
              <button type="button" class="show-more-side" (click)="recommendedExpanded = !recommendedExpanded">
                {{ recommendedExpanded ? 'Show less' : 'Show more' }}
              </button>
            }
          </div>
        }
      </aside>

      <div class="main-col">
        <header class="topbar">
          <div class="search-center">
            <span class="search-ic" aria-hidden="true">⌕</span>
            <input
              #q
              type="search"
              class="search-pill"
              placeholder="Search"
              (keydown.enter)="goSearch(q.value)"
            />
          </div>
          <div class="top-actions">
            <a routerLink="/wallet" class="wallet-btn">Get coins</a>
            @if (auth.isLoggedIn$ | async) {
              <div class="user-wrap" #userRoot>
                <button type="button" class="avatar-btn" (click)="toggleMenu($event)" [attr.aria-expanded]="menuOpen">
                  @if (auth.currentUser$.value?.avatarUrl) {
                    <img [src]="auth.currentUser$.value!.avatarUrl!" alt="" class="avatar-img" />
                  } @else {
                    <span class="avatar-ph">{{ (auth.currentUser$.value?.displayName || auth.currentUser$.value?.username || '?').charAt(0) }}</span>
                  }
                </button>
                @if (menuOpen) {
                  <div class="dropdown" (click)="$event.stopPropagation()">
                    <div class="dd-head">
                      <span class="dd-name">{{ auth.currentUser$.value?.displayName || auth.currentUser$.value?.username }}</span>
                    </div>
                    <a [routerLink]="['/', auth.currentUser$.value?.username]" (click)="menuOpen = false">View channel</a>
                    @if (auth.isStreamer$ | async) {
                      <a routerLink="/dashboard" (click)="menuOpen = false">Creator dashboard</a>
                    }
                    <a routerLink="/subscriptions" (click)="menuOpen = false">Subscriptions</a>
                    <a routerLink="/settings/profile" (click)="menuOpen = false">Settings</a>
                    <button type="button" class="dd-out" (click)="logout()">Log out</button>
                  </div>
                }
              </div>
            } @else {
              <nav class="auth">
                <a routerLink="/login">Login</a>
                <a routerLink="/register" class="accent">Register</a>
              </nav>
            }
          </div>
        </header>
        <main>
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      min-height: 100vh;
      background: var(--bg-shell, #0b0e0f);
    }
    .sidebar {
      width: var(--sidebar-width);
      flex-shrink: 0;
      padding: 1rem 0.75rem;
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 1rem;
      background: rgba(8, 10, 12, 0.96);
    }
    .logo {
      color: var(--accent);
      text-decoration: none;
      font-size: 1.5rem;
      line-height: 1;
      padding: 0 0.35rem;
    }
    .primary {
      display: flex;
      flex-direction: column;
      gap: .15rem;
    }
    .primary a {
      display: flex;
      align-items: center;
      gap: .5rem;
      color: var(--text-secondary);
      text-decoration: none;
      font-weight: 600;
      font-size: .92rem;
      padding: .45rem 0.55rem;
      border-radius: 8px;
    }
    .nav-ic { opacity: .75; font-size: .95rem; }
    .primary a:hover { background: var(--bg-hover); color: var(--text-primary); }
    .primary a.active {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.06);
      box-shadow: inset 3px 0 0 var(--accent);
    }
    .side-section { margin-top: .25rem; min-height: 0; }
    .side-h {
      font-size: .68rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: .06em;
      color: var(--text-muted);
      padding: 0 0.5rem .35rem;
    }
    .side-scroll {
      max-height: 200px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: .15rem;
      transition: max-height .25s ease;
    }
    .side-scroll.expanded { max-height: 420px; }
    .show-more-side {
      width: 100%;
      margin-top: .35rem;
      padding: .35rem;
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: .78rem;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
    }
    .show-more-side:hover { color: var(--accent); }
    .side-empty {
      font-size: .78rem;
      color: var(--text-muted);
      padding: .35rem .5rem;
      margin: 0;
      font-style: italic;
    }
    .side-item {
      display: flex;
      align-items: center;
      gap: .5rem;
      padding: .3rem .4rem;
      border-radius: 8px;
      text-decoration: none;
      color: inherit;
      font-size: .82rem;
      transition: background .12s;
    }
    .side-item:hover { background: var(--bg-hover); }
    .side-av {
      position: relative;
      flex-shrink: 0;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: .82rem;
      color: var(--accent);
    }
    .av-live-dot {
      position: absolute;
      bottom: -1px;
      right: -1px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--accent);
      border: 2px solid var(--bg-shell, #0b0e0f);
      box-shadow: 0 0 6px rgba(83,252,24,.6);
    }
    .side-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: .08rem; }
    .side-name { font-weight: 700; font-size: .84rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary); }
    .side-sub { font-size: .72rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-transform: capitalize; }
    .side-n { font-size: .72rem; color: var(--accent); font-weight: 700; flex-shrink: 0; }
    .main-col { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .topbar {
      min-height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: .5rem 1rem;
      border-bottom: 1px solid var(--border);
      background: rgba(10, 12, 16, 0.92);
      backdrop-filter: blur(12px);
      position: sticky;
      top: 0;
      z-index: 40;
    }
    .search-center {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      width: min(520px, 56vw);
      display: flex;
      align-items: center;
      gap: .5rem;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: .4rem 1rem;
    }
    .search-ic { color: var(--text-muted); font-size: 1rem; opacity: .85; }
    .search-pill {
      flex: 1;
      min-width: 0;
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-family: inherit;
      font-size: .95rem;
      outline: none;
    }
    .search-pill::placeholder { color: var(--text-muted); }
    .top-actions {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: .75rem;
    }
    .wallet-btn {
      text-decoration: none;
      font-weight: 800;
      font-size: .82rem;
      color: #000;
      background: var(--accent);
      padding: .42rem .85rem;
      border-radius: 8px;
      border: none;
    }
    .wallet-btn:hover { filter: brightness(1.08); }
    .user-wrap { position: relative; }
    .avatar-btn {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: 2px solid var(--accent);
      padding: 0;
      cursor: pointer;
      background: var(--bg-tertiary);
      overflow: hidden;
    }
    .avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .avatar-ph {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      font-weight: 800;
      color: var(--accent);
      font-size: 1rem;
    }
    .dropdown {
      position: absolute;
      right: 0;
      top: calc(100% + 8px);
      min-width: 220px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: .5rem 0;
      box-shadow: 0 12px 40px rgba(0,0,0,.45);
      z-index: 50;
    }
    .dropdown a {
      display: block;
      padding: .55rem 1rem;
      color: var(--text-primary);
      text-decoration: none;
      font-weight: 600;
      font-size: .9rem;
    }
    .dropdown a:hover { background: var(--bg-hover); }
    .dd-head { padding: .35rem 1rem .75rem; border-bottom: 1px solid var(--border); margin-bottom: .35rem; }
    .dd-name { font-weight: 800; font-size: .95rem; }
    .dd-out {
      width: 100%;
      text-align: left;
      background: none;
      border: none;
      border-top: 1px solid var(--border);
      margin-top: .35rem;
      padding: .65rem 1rem;
      color: var(--text-secondary);
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      font-size: .9rem;
    }
    .dd-out:hover { color: var(--danger); }
    .auth { display: flex; gap: 1rem; align-items: center; }
    .auth a { color: var(--text-primary); text-decoration: none; font-weight: 600; }
    .auth a.accent { color: var(--accent); }
    main {
      padding: 0;
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }
    @media (max-width: 900px) {
      .search-center { position: relative; left: auto; transform: none; width: 100%; max-width: none; }
      .topbar { flex-wrap: wrap; justify-content: flex-end; }
    }
    @media (max-width: 720px) {
      .shell { flex-direction: column; }
      .sidebar { width: 100%; flex-direction: row; flex-wrap: wrap; align-items: flex-start; }
      .side-section { width: 100%; }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly follows = inject(FollowService);
  private readonly streams = inject(StreamService);

  @ViewChild('userRoot') userRoot?: ElementRef<HTMLElement>;

  liveFollowing: LiveStream[] = [];
  recommended: LiveStream[] = [];
  followingExpanded = false;
  recommendedExpanded = false;
  menuOpen = false;

  private navSub?: Subscription;

  ngOnInit(): void {
    this.navSub = this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.menuOpen = false;
    });

    this.auth.isLoggedIn$
      .pipe(
        distinctUntilChanged(),
        switchMap((logged) => {
          if (!logged) {
            this.liveFollowing = [];
            return this.streams.getLiveStreams(0, 60).pipe(
              timeout({ first: 20_000 }),
              map((r) => r.content ?? []),
              catchError(() => of([] as LiveStream[]))
            );
          }
          return forkJoin({
            fol: this.follows.getLiveFollowing(0, 16).pipe(catchError(() => of({ content: [] as LiveStream[] }))),
            all: this.streams.getLiveStreams(0, 60).pipe(
              timeout({ first: 20_000 }),
              catchError(() => of({ content: [] as LiveStream[] }))
            )
          }).pipe(
            map(({ fol, all }) => {
              this.liveFollowing = fol.content ?? [];
              const excl = new Set((fol.content ?? []).map((s) => s.username));
              return (all.content ?? []).filter((s) => !excl.has(s.username)).slice(0, 10);
            })
          );
        })
      )
      .subscribe((rec) => {
        this.recommended = rec;
      });
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  @HostListener('document:click', ['$event'])
  onDoc(ev: MouseEvent): void {
    const t = ev.target as Node | null;
    if (this.userRoot?.nativeElement && t && this.userRoot.nativeElement.contains(t)) {
      return;
    }
    this.menuOpen = false;
  }

  toggleMenu(ev: MouseEvent): void {
    ev.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  logout(): void {
    this.menuOpen = false;
    this.auth.logout();
  }

  goSearch(value: string): void {
    const q = value.trim();
    if (!q) {
      return;
    }
    this.router.navigate(['/search'], { queryParams: { q } });
  }

  fmt(n: number): string {
    if (n >= 1_000_000) {
      return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (n >= 1_000) {
      return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return String(n);
  }

  catLabel(s: LiveStream): string {
    if (s.categorySlug) {
      return s.categorySlug.replace(/-/g, ' ');
    }
    if (s.title) {
      return s.title.length > 28 ? s.title.slice(0, 28) + '…' : s.title;
    }
    return 'Live';
  }
}
