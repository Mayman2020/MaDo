import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NotificationService, AppNotification } from '../../core/services/notification.service';

@Component({
  selector: 'mado-notifications',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="page">
      <div class="head-row">
        <h1 class="mado-heading">Notifications</h1>
        @if (items.length) {
          <button type="button" class="btn" (click)="markAll()">Mark all read</button>
        }
      </div>
      <ul class="list">
        @for (n of items; track n.id) {
          <li class="mado-card row" [class.unread]="!readFlag(n)">
            <div class="body">
              <div class="title">{{ n.title || n.type }}</div>
              @if (n.message) {
                <div class="msg">{{ n.message }}</div>
              }
              <div class="time">{{ n.createdAt | date: 'medium' }}</div>
            </div>
            @if (!readFlag(n)) {
              <button type="button" class="btn-sm" (click)="readOne(n)">Read</button>
            }
          </li>
        } @empty {
          <li class="muted">No notifications yet.</li>
        }
      </ul>
    </div>
  `,
  styles: [`
    .page { max-width: 720px; margin: 0 auto; padding: 1rem 1rem 3rem; }
    .head-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
    h1 { color: var(--accent); font-size: 2rem; margin: 0; }
    .list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: .75rem; }
    .row { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; padding: 1rem; }
    .row.unread { border-left: 3px solid var(--accent); }
    .title { font-weight: 700; }
    .msg { color: var(--text-secondary); font-size: .9rem; margin-top: .35rem; }
    .time { font-size: .75rem; color: var(--text-muted); margin-top: .5rem; }
    .btn {
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      color: var(--text-primary);
      padding: .4rem .9rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }
    .btn-sm {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--accent);
      padding: .25rem .6rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: .8rem;
      flex-shrink: 0;
    }
    .muted { color: var(--text-muted); padding: 1rem; }
  `]
})
export class NotificationsComponent implements OnInit {
  items: AppNotification[] = [];

  constructor(private readonly notifications: NotificationService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.notifications.list(0, 50).subscribe((p) => (this.items = p.content ?? []));
  }

  readFlag(n: AppNotification): boolean {
    return !!(n.isRead ?? n.read);
  }

  readOne(n: AppNotification): void {
    this.notifications.markRead(n.id).subscribe(() => {
      n.isRead = true;
      n.read = true;
    });
  }

  markAll(): void {
    this.notifications.markAllRead().subscribe(() => this.load());
  }
}
