import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TimeoutError, finalize, forkJoin, timeout } from 'rxjs';
import { StreamCardComponent } from '../../shared/components/stream-card/stream-card.component';
import { SiteFooterComponent } from '../../shared/components/site-footer/site-footer.component';
import { Category, LiveStream, StreamService } from '../../core/services/stream.service';

@Component({
  selector: 'mado-home',
  standalone: true,
  imports: [RouterLink, StreamCardComponent, SiteFooterComponent],
  template: `
    <div class="home">

      @if (loading) {
        <div class="sk-hero-wrap">
          <div class="sk-hero"></div>
        </div>
        <div class="section-wrap">
          <div class="sk-strip">
            @for (i of [1,2,3,4,5]; track i) {
              <div class="sk-strip-item">
                <div class="sk-sthumb"></div>
                <div class="sk-line sk-w1"></div>
              </div>
            }
          </div>
          <div class="sk-cats">
            @for (i of [1,2,3,4,5,6,7,8]; track i) {
              <div class="sk-cat"></div>
            }
          </div>
          <div class="sk-grid">
            @for (i of skeletonSlots; track i) {
              <div class="sk-card">
                <div class="sk-thumb"></div>
                <div class="sk-meta">
                  <div class="sk-av"></div>
                  <div class="sk-lines">
                    <div class="sk-line sk-w1"></div>
                    <div class="sk-line sk-w2"></div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      } @else if (loadError) {
        <div class="home-state err">
          <div class="err-icon">⚡</div>
          <p>{{ loadError }}</p>
          <button type="button" class="retry" (click)="load()">Retry</button>
        </div>
      } @else {

        <!-- HERO -->
        @if (featured) {
          <a [routerLink]="['/', featured.username]" class="hero"
             [style.background-image]="featured.thumbnailUrl ? 'url(' + featured.thumbnailUrl + ')' : 'none'">
            <div class="hero-overlay"></div>
            <div class="hero-content">
              <div class="hero-avatar-wrap">
                <div class="hero-avatar">{{ featured.username.charAt(0).toUpperCase() }}</div>
                <span class="hero-live-badge">LIVE</span>
              </div>
              <div class="hero-body">
                <div class="hero-streamer">
                  <span class="hero-name">{{ featured.username }}</span>
                  <span class="hero-viewers">
                    <span class="v-dot"></span>{{ fmt(featured.viewerCount) }} watching
                  </span>
                </div>
                <h2 class="hero-title">{{ featured.title }}</h2>
                <p class="hero-cat">{{ catName(featured) }}</p>
                <div class="hero-tags">
                  <span class="tag">English</span>
                  <span class="tag">Live</span>
                  @if (featured.categorySlug) {
                    <span class="tag">{{ slugPretty(featured.categorySlug) }}</span>
                  }
                </div>
              </div>
            </div>
            @if (!featured.thumbnailUrl) {
              <div class="hero-ph-bg"></div>
            }
          </a>
        }

        <!-- FEATURED STRIP -->
        @if (featuredStrip.length) {
          <section class="section-wrap">
            <div class="sec-head">
              <h2 class="sec-title">Featured live</h2>
              <a routerLink="/browse" class="view-all">View all →</a>
            </div>
            <div class="h-scroll">
              @for (s of featuredStrip; track s.channelId) {
                <a [routerLink]="['/', s.username]" class="strip-card">
                  <div class="strip-thumb">
                    @if (s.thumbnailUrl) {
                      <img [src]="s.thumbnailUrl" [alt]="s.title" loading="lazy" />
                    } @else {
                      <div class="strip-ph"></div>
                    }
                    <span class="strip-viewers">{{ fmt(s.viewerCount) }}</span>
                  </div>
                  <div class="strip-info">
                    <div class="strip-av">{{ s.username.charAt(0).toUpperCase() }}</div>
                    <div class="strip-meta">
                      <div class="strip-user">{{ s.username }}</div>
                      <div class="strip-ttl">{{ s.title }}</div>
                    </div>
                  </div>
                </a>
              }
            </div>
          </section>
        }

        <!-- TOP CATEGORIES -->
        @if (categories.length) {
          <section class="section-wrap">
            <div class="sec-head">
              <h2 class="sec-title">Top live categories</h2>
              <a routerLink="/browse" class="view-all">View all →</a>
            </div>
            <div class="h-scroll cats-scroll">
              @for (c of categories; track c.id) {
                <a [routerLink]="['/browse', c.slug]" class="cat-tile">
                  @if (c.thumbnailUrl) {
                    <img [src]="c.thumbnailUrl" [alt]="c.name" loading="lazy" />
                  } @else {
                    <div class="cat-ph"></div>
                  }
                  <div class="cat-foot">
                    <span class="cat-name">{{ c.name }}</span>
                    @if (c.viewerCount) {
                      <span class="cat-viewers">{{ fmt(c.viewerCount) }}</span>
                    }
                  </div>
                </a>
              }
            </div>
          </section>
        }

        <!-- CATEGORY SECTIONS -->
        @for (sec of categorySections; track sec.slug) {
          <section class="section-wrap">
            <div class="sec-head">
              <h2 class="sec-title">{{ sec.name }}</h2>
              <a [routerLink]="['/browse', sec.slug]" class="view-all">View all →</a>
            </div>
            <div class="stream-grid">
              @for (s of sec.streams; track s.channelId) {
                <mado-stream-card [stream]="s" />
              }
            </div>
            <div class="show-more-row">
              <a [routerLink]="['/browse', sec.slug]" class="show-more">Show more {{ sec.name }}</a>
            </div>
          </section>
        }

        <!-- MORE LIVE -->
        @if (moreLive.length) {
          <section class="section-wrap">
            <div class="sec-head">
              <h2 class="sec-title">More live channels</h2>
              <a routerLink="/browse" class="view-all">Browse →</a>
            </div>
            <div class="stream-grid">
              @for (s of moreLive; track s.channelId) {
                <mado-stream-card [stream]="s" />
              }
            </div>
          </section>
        }

        <!-- EMPTY -->
        @if (!featured && !featuredStrip.length && !categories.length && !categorySections.length && !moreLive.length) {
          <div class="empty-wrap">
            <div class="empty-icon">📡</div>
            <h2>No live streams right now</h2>
            <p>Check back later or <a routerLink="/browse">browse categories</a> to find content.</p>
          </div>
        }

        <mado-site-footer />
      }
    </div>
  `,
  styles: [`
    .home {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--bg-shell, #0b0e0f);
    }

    /* ─── SKELETON ─── */
    .sk-hero-wrap {
      width: 100%;
      height: 420px;
      background: var(--bg-tertiary);
      animation: pulse 1.4s ease-in-out infinite;
    }
    @media (max-width: 700px) { .sk-hero-wrap { height: 220px; } }
    .sk-hero { width: 100%; height: 100%; }
    .section-wrap { max-width: 1380px; margin: 0 auto; padding: 1.5rem 1.25rem 0; width: 100%; box-sizing: border-box; }
    .sk-strip { display: flex; gap: .75rem; margin-bottom: 1.5rem; }
    .sk-strip-item { flex: 0 0 180px; }
    .sk-sthumb { aspect-ratio: 16/9; border-radius: 8px; background: var(--bg-tertiary); margin-bottom: .35rem; animation: pulse 1.4s ease-in-out infinite; }
    .sk-cats { display: flex; gap: .75rem; margin-bottom: 1.5rem; overflow: hidden; }
    .sk-cat { flex: 0 0 130px; height: 175px; border-radius: 10px; background: var(--bg-tertiary); animation: pulse 1.4s ease-in-out infinite; }
    .sk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 1rem; }
    .sk-card { animation: pulse 1.4s ease-in-out infinite; }
    .sk-thumb { aspect-ratio: 16/9; border-radius: 10px; background: var(--bg-tertiary); }
    .sk-meta { display: flex; gap: .6rem; padding: .5rem 0; }
    .sk-av { width: 36px; height: 36px; border-radius: 50%; background: var(--bg-tertiary); flex-shrink: 0; }
    .sk-lines { flex: 1; display: flex; flex-direction: column; gap: .4rem; padding-top: .2rem; }
    .sk-line { height: 9px; border-radius: 4px; background: var(--bg-tertiary); }
    .sk-w1 { width: 80%; }
    .sk-w2 { width: 55%; }
    @keyframes pulse { 0%, 100% { opacity: .6; } 50% { opacity: 1; } }

    /* ─── ERROR ─── */
    .home-state { max-width: 640px; margin: 0 auto; padding: 3rem 1rem; text-align: center; }
    .home-state.err { color: var(--text-secondary); }
    .err-icon { font-size: 2.5rem; margin-bottom: 1rem; }
    .retry {
      margin-top: 1.25rem;
      background: var(--accent);
      color: #000;
      border: none;
      font-weight: 800;
      padding: .6rem 1.5rem;
      border-radius: 10px;
      cursor: pointer;
      font-family: inherit;
      font-size: .95rem;
    }

    /* ─── HERO (Kick-style full-width) ─── */
    .hero {
      display: block;
      position: relative;
      width: 100%;
      min-height: 400px;
      max-height: 520px;
      background-size: cover;
      background-position: center;
      background-color: #111;
      text-decoration: none;
      color: inherit;
      overflow: hidden;
      cursor: pointer;
    }
    @media (max-width: 700px) { .hero { min-height: 240px; } }
    .hero:hover .hero-overlay { opacity: 1; }
    .hero-ph-bg {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #0d1117 0%, #1a1d2e 50%, #0d1117 100%);
    }
    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to right,
        rgba(0,0,0,.88) 0%,
        rgba(0,0,0,.65) 35%,
        rgba(0,0,0,.15) 65%,
        rgba(0,0,0,.0) 100%
      );
      transition: opacity .2s;
    }
    .hero-content {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 2rem 2.5rem;
      display: flex;
      align-items: flex-end;
      gap: 1.25rem;
      max-width: 640px;
    }
    @media (max-width: 700px) { .hero-content { padding: 1rem 1.25rem; gap: .75rem; } }
    .hero-avatar-wrap { position: relative; flex-shrink: 0; }
    .hero-avatar {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), #2d9e0a);
      border: 3px solid var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 1.65rem;
      color: #000;
      box-shadow: 0 0 20px rgba(83,252,24,.4);
    }
    @media (max-width: 700px) { .hero-avatar { width: 48px; height: 48px; font-size: 1.2rem; } }
    .hero-live-badge {
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      background: #e53935;
      color: #fff;
      font-size: .58rem;
      font-weight: 900;
      letter-spacing: .1em;
      padding: .15rem .4rem;
      border-radius: 3px;
      white-space: nowrap;
    }
    .hero-body { min-width: 0; flex: 1; }
    .hero-streamer {
      display: flex;
      align-items: center;
      gap: .75rem;
      margin-bottom: .35rem;
      flex-wrap: wrap;
    }
    .hero-name {
      font-size: 1.15rem;
      font-weight: 900;
      color: #fff;
    }
    .hero-viewers {
      display: flex;
      align-items: center;
      gap: .3rem;
      font-size: .82rem;
      font-weight: 700;
      color: rgba(255,255,255,.75);
    }
    .v-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--accent);
      flex-shrink: 0;
    }
    .hero-title {
      margin: 0 0 .3rem;
      font-size: 1.4rem;
      font-weight: 800;
      line-height: 1.2;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    @media (max-width: 700px) { .hero-title { font-size: 1rem; } }
    .hero-cat {
      margin: 0 0 .6rem;
      font-size: .88rem;
      font-weight: 600;
      color: var(--accent);
      text-transform: capitalize;
    }
    .hero-tags { display: flex; flex-wrap: wrap; gap: .35rem; }
    .tag {
      font-size: .72rem;
      font-weight: 600;
      color: rgba(255,255,255,.7);
      background: rgba(255,255,255,.1);
      border: 1px solid rgba(255,255,255,.15);
      padding: .18rem .55rem;
      border-radius: 999px;
      text-transform: lowercase;
      backdrop-filter: blur(4px);
    }

    /* ─── SHARED SECTION ─── */
    .sec-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: .9rem;
    }
    .sec-title {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--text-primary);
      text-transform: capitalize;
    }
    .view-all {
      font-size: .85rem;
      font-weight: 700;
      color: var(--accent);
      text-decoration: none;
      white-space: nowrap;
    }
    .view-all:hover { text-decoration: underline; }

    /* ─── H-SCROLL STRIP ─── */
    .h-scroll {
      display: flex;
      gap: .75rem;
      overflow-x: auto;
      padding-bottom: .5rem;
      scrollbar-width: thin;
      scrollbar-color: var(--bg-hover) transparent;
    }
    .h-scroll::-webkit-scrollbar { height: 4px; }
    .h-scroll::-webkit-scrollbar-thumb { background: var(--bg-hover); border-radius: 4px; }

    /* ─── FEATURED STRIP CARDS ─── */
    .strip-card {
      flex: 0 0 200px;
      text-decoration: none;
      color: inherit;
    }
    .strip-card:hover .strip-thumb img,
    .strip-card:hover .strip-ph { filter: brightness(1.1); }
    .strip-thumb {
      position: relative;
      border-radius: 10px;
      overflow: hidden;
      aspect-ratio: 16/9;
      background: var(--bg-tertiary);
    }
    .strip-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .strip-ph { width: 100%; height: 100%; background: var(--bg-tertiary); }
    .strip-viewers {
      position: absolute;
      bottom: .35rem;
      left: .35rem;
      font-size: .68rem;
      font-weight: 800;
      color: #fff;
      background: rgba(0,0,0,.7);
      padding: .1rem .35rem;
      border-radius: 4px;
    }
    .strip-info {
      display: flex;
      align-items: center;
      gap: .45rem;
      padding: .45rem 0 0;
    }
    .strip-av {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: .72rem;
      color: var(--accent);
      flex-shrink: 0;
    }
    .strip-meta { min-width: 0; flex: 1; }
    .strip-user { font-size: .78rem; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .strip-ttl { font-size: .72rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* ─── CATEGORY TILES (3:4 portrait, like Kick) ─── */
    .cats-scroll { align-items: stretch; }
    .cat-tile {
      flex: 0 0 140px;
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      aspect-ratio: 3/4;
      text-decoration: none;
      color: #fff;
      border: 1px solid var(--border);
      transition: transform .15s ease, border-color .15s;
      display: block;
    }
    .cat-tile:hover { transform: scale(1.03); border-color: rgba(83,252,24,.4); }
    .cat-tile img, .cat-ph {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .cat-ph { background: linear-gradient(180deg, #1e2230, #0d0f18); }
    .cat-foot {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: .65rem .5rem .5rem;
      background: linear-gradient(transparent, rgba(0,0,0,.9));
      display: flex;
      flex-direction: column;
      gap: .15rem;
    }
    .cat-name {
      font-size: .72rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: .04em;
      text-align: center;
      line-height: 1.2;
    }
    .cat-viewers {
      font-size: .65rem;
      font-weight: 700;
      color: rgba(255,255,255,.7);
      text-align: center;
    }

    /* ─── STREAM GRID ─── */
    .stream-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: 1rem;
    }
    @media (min-width: 1400px) { .stream-grid { grid-template-columns: repeat(6, 1fr); } }

    /* ─── SHOW MORE ─── */
    .show-more-row { display: flex; justify-content: center; margin-top: 1.25rem; }
    .show-more {
      display: inline-block;
      padding: .5rem 2rem;
      border-radius: 10px;
      border: 1px solid var(--border);
      color: var(--text-secondary);
      font-weight: 700;
      font-size: .88rem;
      text-decoration: none;
      transition: border-color .15s, color .15s;
    }
    .show-more:hover { border-color: var(--accent); color: var(--accent); }

    /* ─── EMPTY ─── */
    .empty-wrap {
      text-align: center;
      padding: 5rem 1rem;
      color: var(--text-secondary);
    }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
    .empty-wrap h2 { color: var(--text-primary); margin: 0 0 .5rem; }
    .empty-wrap p { margin: 0; font-size: .95rem; }
    .empty-wrap a { color: var(--accent); }
  `]
})
export class HomeComponent implements OnInit {
  readonly skeletonSlots = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  loading = true;
  loadError: string | null = null;

  featured: LiveStream | null = null;
  featuredStrip: LiveStream[] = [];
  moreLive: LiveStream[] = [];
  categories: Category[] = [];
  categorySections: { slug: string; name: string; streams: LiveStream[] }[] = [];

  private allLive: LiveStream[] = [];

  constructor(private readonly streams: StreamService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = null;
    forkJoin({
      live: this.streams.getLiveStreams(0, 60),
      cats: this.streams.getCategories(0, 16)
    })
      .pipe(
        timeout({ first: 18_000 }),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: ({ live, cats }) => {
          this.loadError = null;
          this.allLive = live.content ?? [];
          this.categories = (cats.content ?? []).slice(0, 12);
          this.featured = this.allLive[0] ?? null;
          this.featuredStrip = this.allLive.slice(1, 7);
          this.categorySections = this.buildCategorySections(this.allLive);
          this.moreLive = this.computeMoreLive();
        },
        error: (err: unknown) => {
          if (err instanceof TimeoutError) {
            this.loadError = 'Request timed out. Start the backend on http://127.0.0.1:8090 (profile: local), then Retry.';
          } else {
            this.loadError = 'Could not load the homepage. Confirm the backend is running on http://127.0.0.1:8090 and try Retry.';
          }
        }
      });
  }

  fmt(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  }

  catName(s: LiveStream): string {
    return s.categorySlug ? this.slugPretty(s.categorySlug) : 'Live';
  }

  slugPretty(slug: string): string {
    return slug.replace(/-/g, ' ');
  }

  private buildCategorySections(streams: LiveStream[]): { slug: string; name: string; streams: LiveStream[] }[] {
    const map = new Map<string, LiveStream[]>();
    for (const s of streams) {
      const key = s.categorySlug || '';
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    const rows = [...map.entries()].map(([slug, st]) => ({
      slug,
      name: this.titleCase(slug.replace(/-/g, ' ')),
      streams: [...st].sort((a, b) => b.viewerCount - a.viewerCount).slice(0, 6)
    }));
    rows.sort((a, b) => {
      const ma = Math.max(0, ...a.streams.map((x) => x.viewerCount));
      const mb = Math.max(0, ...b.streams.map((x) => x.viewerCount));
      return mb - ma;
    });
    return rows.slice(0, 4);
  }

  private computeMoreLive(): LiveStream[] {
    const used = new Set<string>();
    if (this.featured) used.add(this.featured.channelId);
    for (const s of this.featuredStrip) used.add(s.channelId);
    for (const sec of this.categorySections) for (const s of sec.streams) used.add(s.channelId);
    return this.allLive.filter((s) => !used.has(s.channelId)).slice(0, 12);
  }

  private titleCase(s: string): string {
    return s.replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
