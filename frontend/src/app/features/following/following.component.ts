import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StreamCardComponent } from '../../shared/components/stream-card/stream-card.component';
import { FollowService } from '../../core/services/follow.service';
import { ChannelPublic, LiveStream } from '../../core/services/stream.service';

@Component({
  selector: 'mado-following',
  standalone: true,
  imports: [RouterLink, StreamCardComponent],
  template: `
    <div class="page">
      <h1 class="mado-heading">Following</h1>
      <p class="lead">Live channels from creators you follow</p>
      @if (live.length === 0) {
        <div class="empty mado-card">
          <p>No one you follow is live right now.</p>
          <a routerLink="/browse" class="cta">Browse live streams</a>
        </div>
      } @else {
        <div class="grid">
          @for (s of live; track s.channelId) {
            <mado-stream-card [stream]="s" />
          }
        </div>
      }
      <section class="side-block">
        <h2>Your follows</h2>
        <ul class="follow-list">
          @for (c of following; track c.id) {
            <li>
              <a [routerLink]="['/', c.username]">{{ c.title || c.username }}</a>
              @if (c.isLive) {
                <span class="dot">●</span>
              }
            </li>
          } @empty {
            <li class="muted">You are not following anyone yet.</li>
          }
        </ul>
      </section>
    </div>
  `,
  styles: [`
    .page { max-width: 1200px; margin: 0 auto; padding: 1rem 1rem 3rem; }
    h1 { color: var(--accent); font-size: 2.25rem; margin: 0 0 .25rem; }
    .lead { color: var(--text-secondary); margin-bottom: 1.5rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
    .empty { padding: 2rem; text-align: center; color: var(--text-secondary); }
    .cta { display: inline-block; margin-top: 1rem; color: var(--accent); font-weight: 700; text-decoration: none; }
    .side-block { margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border); }
    h2 { font-size: 1.1rem; margin: 0 0 .75rem; color: var(--text-primary); }
    .follow-list { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: .5rem 1.25rem; }
    .follow-list a { color: var(--text-secondary); text-decoration: none; font-weight: 600; }
    .follow-list a:hover { color: var(--accent); }
    .dot { color: var(--accent); margin-left: .25rem; font-size: .75rem; }
    .muted { color: var(--text-muted); }
  `]
})
export class FollowingComponent implements OnInit {
  live: LiveStream[] = [];
  following: ChannelPublic[] = [];

  constructor(private readonly follows: FollowService) {}

  ngOnInit(): void {
    this.follows.getLiveFollowing(0, 48).subscribe((p) => (this.live = p.content ?? []));
    this.follows.getFollowing().subscribe((list) => (this.following = list ?? []));
  }
}
