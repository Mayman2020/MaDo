import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LiveStream } from '../../../core/services/stream.service';

@Component({
  selector: 'mado-stream-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <a [routerLink]="['/', stream.username]" class="card">
      <div class="thumb">
        @if (stream.thumbnailUrl) {
          <img [src]="stream.thumbnailUrl" [alt]="stream.title" loading="lazy" />
        } @else {
          <div class="thumb-ph"></div>
        }
        @if (stream.streamId) {
          <span class="badge-live">LIVE</span>
        }
        <span class="viewers">{{ fmt(stream.viewerCount) }} watching</span>
      </div>
      <div class="meta">
        <div class="avatar" aria-hidden="true">{{ (stream.username || '?').charAt(0).toUpperCase() }}</div>
        <div class="info">
          <div class="title">{{ stream.title }}</div>
          <div class="cat">{{ categoryLabel }}</div>
          <div class="user">{{ stream.username }}</div>
          <div class="tags">
            <span class="tag">English</span>
            @if (stream.categorySlug) {
              <span class="tag">{{ slugPretty(stream.categorySlug) }}</span>
            }
          </div>
        </div>
      </div>
    </a>
  `,
  styles: [`
    .card {
      display: block;
      text-decoration: none;
      color: inherit;
      overflow: hidden;
      border-radius: 12px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
    }
    .card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 32px rgba(0,0,0,.4);
      border-color: rgba(83, 252, 24, 0.25);
    }
    .thumb {
      position: relative;
      aspect-ratio: 16/9;
      background: linear-gradient(145deg, #14141c, #0a0a10);
      overflow: hidden;
    }
    .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .thumb-ph { width: 100%; height: 100%; min-height: 120px; background: var(--bg-tertiary); }
    .badge-live {
      position: absolute;
      top: .5rem;
      left: .5rem;
      background: var(--accent);
      color: #000;
      font-size: .65rem;
      font-weight: 900;
      letter-spacing: .06em;
      padding: .2rem .45rem;
      border-radius: 4px;
    }
    .viewers {
      position: absolute;
      bottom: .5rem;
      left: .5rem;
      background: rgba(0, 0, 0, 0.72);
      color: #fff;
      font-size: .72rem;
      font-weight: 700;
      padding: .25rem .5rem;
      border-radius: 6px;
    }
    .meta {
      display: flex;
      gap: .65rem;
      padding: .65rem .75rem .85rem;
      align-items: flex-start;
    }
    .avatar {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: .95rem;
      color: var(--accent);
    }
    .info { min-width: 0; flex: 1; }
    .title {
      font-weight: 800;
      font-size: .88rem;
      line-height: 1.25;
      color: var(--text-primary);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .cat {
      font-size: .78rem;
      color: var(--text-muted);
      margin-top: .2rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user {
      font-size: .78rem;
      color: var(--text-secondary);
      margin-top: .1rem;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: .35rem;
      margin-top: .4rem;
    }
    .tag {
      font-size: .65rem;
      font-weight: 600;
      color: var(--text-secondary);
      background: var(--bg-tertiary);
      padding: .12rem .45rem;
      border-radius: 999px;
      border: 1px solid var(--border);
    }
  `]
})
export class StreamCardComponent {
  @Input({ required: true }) stream!: LiveStream;

  get categoryLabel(): string {
    if (this.stream.categorySlug) {
      return this.stream.categorySlug.replace(/-/g, ' ');
    }
    return 'Live';
  }

  slugPretty(slug: string): string {
    return slug.replace(/-/g, ' ');
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
}
