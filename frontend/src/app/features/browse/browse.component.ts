import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StreamCardComponent } from '../../shared/components/stream-card/stream-card.component';
import { Category, LiveStream, StreamService } from '../../core/services/stream.service';

@Component({
  selector: 'mado-browse',
  standalone: true,
  imports: [RouterLink, StreamCardComponent],
  template: `
    <div class="page">
      <div class="tabs">
        <button type="button" [class.on]="tab === 'live'" (click)="tab = 'live'">Live streams</button>
        <button type="button" [class.on]="tab === 'cat'" (click)="tab = 'cat'">Categories</button>
      </div>
      @if (tab === 'live') {
        <h1 class="mado-heading">Browse live</h1>
        <p class="lead">Sorted by viewers</p>
        <div class="grid">
          @for (s of streams; track s.channelId) {
            <mado-stream-card [stream]="s" />
          }
        </div>
      } @else {
        <h1 class="mado-heading">Categories</h1>
        <p class="lead">Pick a category to see who is live</p>
        <div class="cat-grid">
          @for (c of categories; track c.id) {
            <a [routerLink]="['/browse', c.slug]" class="cat mado-card">
              @if (c.thumbnailUrl) {
                <img [src]="c.thumbnailUrl" [alt]="c.name" />
              } @else {
                <div class="ph"></div>
              }
              <div class="cn">{{ c.name }}</div>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1200px; margin: 0 auto; padding: 1rem 1rem 3rem; }
    .tabs { display: flex; gap: .5rem; margin-bottom: 1rem; }
    .tabs button {
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      color: var(--text-secondary);
      padding: .4rem 1rem;
      border-radius: 999px;
      cursor: pointer;
      font-weight: 700;
      font-family: inherit;
    }
    .tabs button.on {
      border-color: var(--accent);
      color: var(--accent);
      background: rgba(83, 252, 24, 0.08);
    }
    h1 { color: var(--accent); font-size: 2.25rem; margin: 0 0 .25rem; }
    .lead { color: var(--text-secondary); margin-bottom: 1.5rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
    .cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; }
    .cat {
      text-decoration: none;
      color: inherit;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .cat img, .ph { width: 100%; aspect-ratio: 16/10; object-fit: cover; background: var(--bg-tertiary); }
    .cn { padding: .75rem; font-weight: 700; font-size: .95rem; }
  `]
})
export class BrowseComponent implements OnInit {
  tab: 'live' | 'cat' = 'live';
  streams: LiveStream[] = [];
  categories: Category[] = [];

  constructor(private readonly streamsApi: StreamService) {}

  ngOnInit(): void {
    this.streamsApi.getLiveStreams(0, 48).subscribe((p) => (this.streams = p.content ?? []));
    this.streamsApi.getCategories(0, 80).subscribe((p) => (this.categories = p.content ?? []));
  }
}
