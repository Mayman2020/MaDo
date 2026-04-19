import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CategorySearchHit, ChannelPublic, StreamService } from '../../core/services/stream.service';

@Component({
  selector: 'mado-search',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="mado-heading">Search</h1>
      @if (query) {
        <p class="lead">Results for “{{ query }}”</p>
      } @else {
        <p class="lead">Enter a search term in the header.</p>
      }
      <section>
        <h2>Channels</h2>
        @if (channels.length === 0 && query) {
          <p class="muted">No channels found.</p>
        }
        <div class="ch-grid">
          @for (c of channels; track c.id) {
            <a [routerLink]="['/', c.username]" class="ch mado-card">
              <div class="name">{{ c.title || c.username }}</div>
              <div class="sub">{{ c.username }}</div>
            </a>
          }
        </div>
      </section>
      <section>
        <h2>Categories</h2>
        @if (categories.length === 0 && query) {
          <p class="muted">No categories found.</p>
        }
        <div class="cat-grid">
          @for (c of categories; track c.id) {
            <a [routerLink]="['/browse', c.slug]" class="cat mado-card">
              <span class="cn">{{ c.name }}</span>
            </a>
          }
        </div>
      </section>
      <section>
        <h2>Clips</h2>
        @if (clips.length === 0 && query) {
          <p class="muted">No clips found.</p>
        }
        <div class="clip-grid">
          @for (cl of clips; track cl.id) {
            <a class="clip mado-card" [href]="cl.clipUrl" target="_blank" rel="noopener">
              @if (cl.thumbnailUrl) {
                <img [src]="cl.thumbnailUrl" [alt]="cl.title" />
              }
              <div class="meta">
                <strong>{{ cl.title }}</strong>
                <span>{{ cl.channelUsername }}</span>
              </div>
            </a>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page { max-width: 1000px; margin: 0 auto; padding: 1rem 1rem 3rem; }
    h1 { color: var(--accent); font-size: 2rem; margin: 0 0 .5rem; }
    .lead { color: var(--text-secondary); margin-bottom: 1.5rem; }
    h2 { font-size: 1.1rem; margin: 1.5rem 0 .75rem; }
    .muted { color: var(--text-muted); }
    .ch-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: .75rem; }
    .ch { padding: 1rem; text-decoration: none; color: inherit; display: block; }
    .name { font-weight: 700; color: var(--text-primary); }
    .sub { font-size: .85rem; color: var(--text-secondary); margin-top: .25rem; }
    .clip-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
    .clip { overflow: hidden; text-decoration: none; color: inherit; }
    .clip img { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; background: var(--bg-tertiary); }
    .clip .meta { padding: .75rem; display: flex; flex-direction: column; gap: .25rem; }
    .clip .meta span { font-size: .8rem; color: var(--text-secondary); }
    .cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: .75rem; }
    .cat { padding: .85rem 1rem; text-decoration: none; color: var(--text-primary); display: block; }
    .cn { font-weight: 700; }
  `]
})
export class SearchComponent implements OnInit {
  query = '';
  channels: ChannelPublic[] = [];
  categories: CategorySearchHit[] = [];
  clips: {
    id: string;
    title: string;
    clipUrl: string;
    channelUsername: string;
    thumbnailUrl: string | null;
  }[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly streams: StreamService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.query = (params.get('q') ?? '').trim();
      if (!this.query) {
        this.channels = [];
        this.categories = [];
        this.clips = [];
        return;
      }
      this.streams.search(this.query, 'channel').subscribe((res) => {
        this.channels = res.channels ?? [];
      });
      this.streams.search(this.query, 'category').subscribe((res) => {
        this.categories = res.categories ?? [];
      });
      this.streams.search(this.query, 'clip').subscribe((res) => {
        this.clips = (res.clips ?? []) as typeof this.clips;
      });
    });
  }
}
