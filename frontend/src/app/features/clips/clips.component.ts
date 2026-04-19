import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SpringPage } from '../../core/models/spring-page';

interface ClipRow {
  id: string;
  title: string;
  clipUrl: string;
  channelUsername: string;
  viewCount: number;
  thumbnailUrl: string | null;
}

@Component({
  selector: 'mado-clips',
  standalone: true,
  template: `
    <div class="page">
      <h1 class="mado-heading">Clips</h1>
      <p class="lead">Community highlights</p>
      <div class="grid">
        @for (c of clips; track c.id) {
          <a class="card mado-card" [href]="c.clipUrl" target="_blank" rel="noopener">
            @if (c.thumbnailUrl) {
              <img [src]="c.thumbnailUrl" [alt]="c.title" />
            } @else {
              <div class="ph"></div>
            }
            <div class="body">
              <strong>{{ c.title }}</strong>
              <span>{{ c.channelUsername }} · {{ c.viewCount }} views</span>
            </div>
          </a>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; margin: 2rem auto; padding: 1rem 1rem 3rem; }
    h1 { color: var(--accent); font-size: 2.25rem; margin: 0 0 .25rem; }
    .lead { color: var(--text-secondary); margin-bottom: 1.5rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
    .card {
      display: flex;
      flex-direction: column;
      text-decoration: none;
      color: inherit;
      overflow: hidden;
    }
    img, .ph {
      width: 100%;
      aspect-ratio: 16/9;
      object-fit: cover;
      background: var(--bg-tertiary);
    }
    .body {
      padding: .85rem 1rem;
      display: flex;
      flex-direction: column;
      gap: .35rem;
    }
    .body span { font-size: .85rem; color: var(--text-secondary); }
  `]
})
export class ClipsComponent implements OnInit {
  clips: ClipRow[] = [];

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.http
      .get<SpringPage<ClipRow>>('/api/clips', { params: { page: '0', size: '36' } })
      .subscribe((p) => (this.clips = p.content ?? []));
  }
}
