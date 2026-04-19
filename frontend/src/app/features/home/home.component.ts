import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
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
        <div class="home-state">
          <p class="load-txt">Loading…</p>
          <div class="sk-grid">
            @for (i of skeletonSlots; track i) {
              <div class="sk-card">
                <div class="sk-thumb"></div>
                <div class="sk-line sk-w1"></div>
                <div class="sk-line sk-w2"></div>
              </div>
            }
          </div>
        </div>
      } @else if (loadError) {
        <div class="home-state err">
          <p>{{ loadError }}</p>
          <button type="button" class="retry" (click)="load()">Retry</button>
        </div>
      } @else {
      @if (featured) {
        <section class="hero">
          <a [routerLink]="['/', featured.username]" class="hero-card mado-card">
            <div class="hero-info">
              <div class="hero-avatar">{{ featured.username.charAt(0).toUpperCase() }}</div>
              <div>
                <div class="hero-name">{{ featured.username }}</div>
                <div class="hero-watch">{{ fmt(featured.viewerCount) }} watching</div>
                <h2 class="hero-title">{{ featured.title }}</h2>
                <p class="hero-cat">{{ catName(featured) }}</p>
                <div class="hero-tags">
                  <span class="pill">english</span>
                  <span class="pill">live</span>
                  @if (featured.categorySlug) {
                    <span class="pill">{{ slugPretty(featured.categorySlug) }}</span>
                  }
                </div>
              </div>
            </div>
            <div class="hero-media">
              @if (featured.thumbnailUrl) {
                <img [src]="featured.thumbnailUrl" [alt]="featured.title" />
              } @else {
                <div class="hero-ph"></div>
              }
              <span class="hero-live">LIVE</span>
              <span class="hero-views">{{ fmt(featured.viewerCount) }} watching</span>
            </div>
          </a>
        </section>
      }

      @if (featuredStrip.length) {
        <section class="strip-wrap">
          <div class="strip-head">
            <h2 class="h2">Featured live</h2>
            <a routerLink="/browse" class="view-all">View all</a>
          </div>
          <div class="strip">
            @for (s of featuredStrip; track s.channelId) {
              <a [routerLink]="['/', s.username]" class="strip-item">
                <div class="strip-thumb">
                  @if (s.thumbnailUrl) {
                    <img [src]="s.thumbnailUrl" [alt]="s.title" />
                  }
                  <span class="strip-v">{{ fmt(s.viewerCount) }}</span>
                </div>
                <div class="strip-t">{{ s.title }}</div>
              </a>
            }
          </div>
        </section>
      }

      @if (categories.length) {
        <section class="cats-section">
          <div class="strip-head">
            <h2 class="h2">Top live categories</h2>
            <a routerLink="/browse" class="view-all">View all</a>
          </div>
          <div class="cats-scroll">
            @for (c of categories; track c.id) {
              <a [routerLink]="['/browse', c.slug]" class="cat-tile">
                @if (c.thumbnailUrl) {
                  <img [src]="c.thumbnailUrl" [alt]="c.name" />
                } @else {
                  <div class="cat-ph"></div>
                }
                <span class="cat-name">{{ c.name }}</span>
                @if (c.viewerCount) {
                  <span class="cat-views">{{ fmt(c.viewerCount) }}</span>
                }
              </a>
            }
          </div>
        </section>
      }

      @for (sec of categorySections; track sec.slug) {
        <section class="grid-wrap">
          <div class="strip-head">
            <h2 class="h2 section-cap">{{ sec.name }}</h2>
            <a [routerLink]="['/browse', sec.slug]" class="view-all">View all</a>
          </div>
          <div class="grid">
            @for (s of sec.streams; track s.channelId) {
              <mado-stream-card [stream]="s" />
            }
          </div>
          <div class="show-more-row">
            <a [routerLink]="['/browse', sec.slug]" class="show-more">Show more</a>
          </div>
        </section>
      }

      @if (moreLive.length) {
        <section class="grid-wrap">
          <div class="strip-head">
            <h2 class="h2">More live</h2>
            <a routerLink="/browse" class="view-all">Browse</a>
          </div>
          <div class="grid">
            @for (s of moreLive; track s.channelId) {
              <mado-stream-card [stream]="s" />
            }
          </div>
        </section>
      }

      <mado-site-footer />

      @if (!featured && !featuredStrip.length && !categories.length && !categorySections.length && !moreLive.length) {
        <div class="empty-hint mado-card">
          <p>No live streams right now. Open <a routerLink="/browse">Browse</a> or start your broadcast from the dashboard.</p>
        </div>
      }
      }
    </div>
  `,
  styles: [`
    .home {
      background: #000;
      min-height: 100%;
      padding-bottom: 0;
    }
    .home-state {
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }
    .load-txt { color: var(--text-secondary); margin: 0 0 1rem; }
    .sk-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }
    .sk-card { animation: pulse 1.2s ease-in-out infinite; }
    .sk-thumb {
      aspect-ratio: 16/9;
      border-radius: 12px;
      background: linear-gradient(90deg, var(--bg-tertiary), var(--bg-hover), var(--bg-tertiary));
      background-size: 200% 100%;
    }
    .sk-line { height: 10px; border-radius: 4px; margin-top: .5rem; background: var(--bg-tertiary); }
    .sk-w1 { width: 85%; }
    .sk-w2 { width: 55%; }
    @keyframes pulse {
      0%, 100% { opacity: .75; }
      50% { opacity: 1; }
    }
    .home-state.err {
      text-align: center;
      color: var(--text-secondary);
    }
    .home-state.err .retry {
      margin-top: 1rem;
      background: var(--accent);
      color: #000;
      border: none;
      font-weight: 800;
      padding: .55rem 1.25rem;
      border-radius: 10px;
      cursor: pointer;
      font-family: inherit;
    }
    .empty-hint {
      max-width: 640px;
      margin: 2rem auto;
      padding: 1.25rem;
      color: var(--text-secondary);
      font-size: .95rem;
    }
    .empty-hint a { color: var(--accent); }
    .hero {
      max-width: 1280px;
      margin: 0 auto;
      padding: 1rem 1rem 0;
    }
    .hero-card {
      display: grid;
      grid-template-columns: minmax(260px, 1fr) minmax(0, 1.4fr);
      gap: 1.25rem;
      padding: 1.25rem;
      text-decoration: none;
      color: inherit;
      border-radius: 14px;
      overflow: hidden;
      transition: box-shadow .2s ease, border-color .2s ease;
    }
    .hero-card:hover {
      box-shadow: 0 16px 48px rgba(0,0,0,.5);
      border-color: rgba(83, 252, 24, 0.2);
    }
    .hero-info {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }
    .hero-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--bg-tertiary);
      border: 2px solid var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 1.25rem;
      color: var(--accent);
      flex-shrink: 0;
    }
    .hero-name { font-weight: 800; color: var(--text-primary); }
    .hero-watch {
      display: inline-block;
      margin-top: .25rem;
      font-size: .8rem;
      font-weight: 700;
      color: var(--accent);
      background: rgba(83, 252, 24, 0.1);
      padding: .15rem .5rem;
      border-radius: 6px;
    }
    .hero-title {
      margin: .75rem 0 .35rem;
      font-size: 1.15rem;
      font-weight: 800;
      line-height: 1.3;
      color: var(--text-primary);
    }
    .hero-cat { margin: 0; font-size: .9rem; color: var(--text-muted); text-transform: capitalize; }
    .hero-tags { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .75rem; }
    .pill {
      font-size: .72rem;
      font-weight: 600;
      color: var(--text-secondary);
      background: var(--bg-tertiary);
      padding: .2rem .55rem;
      border-radius: 999px;
      border: 1px solid var(--border);
      text-transform: lowercase;
    }
    .hero-media {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      aspect-ratio: 16/9;
      min-height: 180px;
      background: #111;
    }
    .hero-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .hero-ph { width: 100%; height: 100%; min-height: 200px; background: linear-gradient(160deg, #1a1a24, #0a0a10); }
    .hero-live {
      position: absolute;
      top: .65rem;
      left: .65rem;
      background: var(--accent);
      color: #000;
      font-size: .65rem;
      font-weight: 900;
      letter-spacing: .08em;
      padding: .2rem .5rem;
      border-radius: 4px;
    }
    .hero-views {
      position: absolute;
      bottom: .65rem;
      left: .65rem;
      background: rgba(0,0,0,.75);
      color: #fff;
      font-size: .78rem;
      font-weight: 700;
      padding: .3rem .6rem;
      border-radius: 8px;
    }
    @media (max-width: 900px) {
      .hero-card { grid-template-columns: 1fr; }
    }

    .strip-wrap, .cats-section, .grid-wrap {
      max-width: 1280px;
      margin: 0 auto;
      padding: 1.5rem 1rem 0;
    }
    .strip-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .h2 {
      margin: 0;
      font-size: 1.35rem;
      font-weight: 800;
      color: #fff;
      text-transform: capitalize;
    }
    .section-cap { text-transform: none; }
    .view-all {
      font-size: .88rem;
      font-weight: 700;
      color: var(--accent);
      text-decoration: none;
    }
    .view-all:hover { text-decoration: underline; }
    .strip {
      display: flex;
      gap: .75rem;
      overflow-x: auto;
      padding-bottom: .5rem;
      scrollbar-width: thin;
    }
    .strip-item {
      flex: 0 0 200px;
      text-decoration: none;
      color: inherit;
    }
    .strip-thumb {
      position: relative;
      border-radius: 10px;
      overflow: hidden;
      aspect-ratio: 16/9;
      background: var(--bg-tertiary);
    }
    .strip-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .strip-v {
      position: absolute;
      bottom: .35rem;
      left: .35rem;
      font-size: .68rem;
      font-weight: 800;
      color: #fff;
      background: rgba(0,0,0,.7);
      padding: .12rem .35rem;
      border-radius: 4px;
    }
    .strip-t {
      margin-top: .4rem;
      font-size: .78rem;
      font-weight: 700;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .cats-scroll {
      display: flex;
      gap: .75rem;
      overflow-x: auto;
      padding-bottom: .5rem;
    }
    .cat-tile {
      flex: 0 0 140px;
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      aspect-ratio: 3/4;
      text-decoration: none;
      color: #fff;
      border: 1px solid var(--border);
      transition: transform .15s ease;
    }
    .cat-tile:hover { transform: scale(1.03); }
    .cat-tile img, .cat-ph {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .cat-ph { background: linear-gradient(180deg, #252530, #12121a); }
    .cat-name {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: .65rem .5rem;
      font-size: .72rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: .03em;
      background: linear-gradient(transparent, rgba(0,0,0,.9));
      text-align: center;
      line-height: 1.2;
    }
    .cat-views {
      position: absolute;
      top: .4rem;
      right: .4rem;
      font-size: .65rem;
      font-weight: 700;
      background: rgba(0,0,0,.65);
      padding: .1rem .35rem;
      border-radius: 4px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }
    @media (min-width: 1400px) {
      .grid { grid-template-columns: repeat(5, 1fr); }
    }
    .show-more-row {
      display: flex;
      justify-content: center;
      margin-top: 1.25rem;
    }
    .show-more {
      display: inline-block;
      padding: .5rem 2rem;
      border-radius: 10px;
      border: 1px solid var(--border);
      color: var(--text-secondary);
      font-weight: 700;
      font-size: .88rem;
      text-decoration: none;
    }
    .show-more:hover {
      border-color: var(--accent);
      color: var(--accent);
    }
  `]
})
export class HomeComponent implements OnInit {
  readonly skeletonSlots = [1, 2, 3, 4, 5, 6, 7, 8];

  loading = true;
  loadError: string | null = null;

  featured: LiveStream | null = null;
  featuredStrip: LiveStream[] = [];
  /** Streams not already shown in hero + strip + category rows (deduped). */
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
      .pipe(finalize(() => (this.loading = false)))
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
        error: () => {
          this.loadError =
            'Could not load the homepage. Confirm the API is running on port 8081 (profile local) and try Retry.';
        }
      });
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
      if (!key) {
        continue;
      }
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(s);
    }
    const rows = [...map.entries()].map(([slug, st]) => ({
      slug,
      name: this.titleCase(slug.replace(/-/g, ' ')),
      streams: [...st].sort((a, b) => b.viewerCount - a.viewerCount).slice(0, 5)
    }));
    rows.sort((a, b) => {
      const ma = Math.max(0, ...a.streams.map((x) => x.viewerCount));
      const mb = Math.max(0, ...b.streams.map((x) => x.viewerCount));
      return mb - ma;
    });
    return rows.slice(0, 4);
  }

  /** Streams that are not the featured hero and not in strip or category sections. */
  private computeMoreLive(): LiveStream[] {
    const used = new Set<string>();
    if (this.featured) {
      used.add(this.featured.channelId);
    }
    for (const s of this.featuredStrip) {
      used.add(s.channelId);
    }
    for (const sec of this.categorySections) {
      for (const s of sec.streams) {
        used.add(s.channelId);
      }
    }
    return this.allLive.filter((s) => !used.has(s.channelId)).slice(0, 12);
  }

  private titleCase(s: string): string {
    return s.replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
