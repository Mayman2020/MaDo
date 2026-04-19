import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SubscriptionService, MySubscription } from '../../core/services/subscription.service';

@Component({
  selector: 'mado-subscriptions',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="page">
      <h1 class="mado-heading">My subscriptions</h1>
      <p class="lead">Active channel subscriptions</p>
      <div class="list">
        @for (s of subs; track s.id) {
          <div class="row mado-card">
            <div>
              @if (channelName(s)) {
                <a [routerLink]="['/', channelName(s)]" class="name">{{ channelLabel(s) }}</a>
              } @else {
                <span class="name plain">{{ channelLabel(s) }}</span>
              }
              <div class="meta">{{ s.tier }} · renews {{ s.expiresAt | date: 'medium' }}</div>
            </div>
            <span class="pill" [class.off]="!s.isActive">{{ s.isActive ? 'Active' : 'Inactive' }}</span>
          </div>
        } @empty {
          <p class="muted">No subscriptions yet.</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 720px; margin: 0 auto; padding: 1rem 1rem 3rem; }
    h1 { color: var(--accent); font-size: 2rem; margin: 0 0 .25rem; }
    .lead { color: var(--text-secondary); margin-bottom: 1.5rem; }
    .list { display: flex; flex-direction: column; gap: .75rem; }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
    }
    .name { font-weight: 800; color: var(--accent); text-decoration: none; }
    .name.plain { color: var(--text-primary); }
    .meta { font-size: .85rem; color: var(--text-secondary); margin-top: .25rem; }
    .pill {
      font-size: .75rem;
      font-weight: 800;
      padding: .2rem .55rem;
      border-radius: 999px;
      background: rgba(83, 252, 24, 0.15);
      color: var(--accent);
    }
    .pill.off { background: var(--bg-tertiary); color: var(--text-muted); }
    .muted { color: var(--text-muted); }
  `]
})
export class SubscriptionsComponent implements OnInit {
  subs: MySubscription[] = [];

  constructor(private readonly subscriptionService: SubscriptionService) {}

  ngOnInit(): void {
    this.subscriptionService.mySubscriptions().subscribe((r) => (this.subs = r ?? []));
  }

  channelName(s: MySubscription): string {
    return s.channel?.user?.username ?? '';
  }

  channelLabel(s: MySubscription): string {
    return s.channel?.title || s.channel?.user?.username || 'Channel';
  }
}
