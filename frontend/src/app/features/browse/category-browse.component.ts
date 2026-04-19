import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StreamCardComponent } from '../../shared/components/stream-card/stream-card.component';
import { LiveStream, StreamService } from '../../core/services/stream.service';

@Component({
  selector: 'mado-category-browse',
  standalone: true,
  imports: [StreamCardComponent],
  template: `
    <div class="page">
      <h1 class="mado-heading">{{ slug }}</h1>
      <div class="grid">
        @for (s of streams; track s.channelId) {
          <mado-stream-card [stream]="s" />
        }
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1200px; margin: 0 auto; padding: 1rem; }
    h1 { color: var(--accent); text-transform: capitalize; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; margin-top: 1rem; }
  `]
})
export class CategoryBrowseComponent implements OnInit {
  slug = '';
  streams: LiveStream[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly streamsApi: StreamService
  ) {}

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('cat') ?? '';
    this.streamsApi.getLiveByCategory(this.slug, 0, 48).subscribe((p) => (this.streams = p.content ?? []));
  }
}
