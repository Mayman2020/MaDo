import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService, UserPreferencesDto } from '../../core/services/user.service';
import { ToastrService } from 'ngx-toastr';

const LS_WEB_LIVE = 'mado_notify_web_live';

@Component({
  selector: 'mado-settings-notifications',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h2 class="section-title">Notifications</h2>
    <section class="mado-card block">
      <h3>Live</h3>
      <label class="row">
        <div>
          <div class="lbl">In-browser (active tab)</div>
          <p class="hint">Stored locally until a server flag exists.</p>
        </div>
        <input type="checkbox" [(ngModel)]="notifyWebLive" (ngModelChange)="persistWeb()" />
      </label>
      <label class="row">
        <div>
          <div class="lbl">Email when a followed channel goes live</div>
        </div>
        <input type="checkbox" [(ngModel)]="prefs.emailOnLive" />
      </label>
      <label class="row">
        <div>
          <div class="lbl">Push when live</div>
          <p class="hint">Requires mobile/web push wiring.</p>
        </div>
        <input type="checkbox" [(ngModel)]="prefs.pushOnLive" />
      </label>
    </section>
    <section class="mado-card block">
      <h3>Community</h3>
      <label class="row">
        <div>
          <div class="lbl">Email on new follower</div>
        </div>
        <input type="checkbox" [(ngModel)]="prefs.emailOnFollow" />
      </label>
    </section>
    <button type="button" class="btn" (click)="save()">Save</button>
  `,
  styles: [`
    .section-title { font-size: 1.35rem; margin: 0 0 1rem; color: var(--text-primary); }
    h3 { font-size: 1rem; margin: 0 0 .75rem; color: var(--text-secondary); }
    .block { padding: 1.25rem; margin-bottom: 1rem; }
    .row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin: 1rem 0;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }
    .row:last-of-type { border-bottom: none; }
    .lbl { font-weight: 600; color: var(--text-primary); }
    .hint { font-size: .82rem; color: var(--text-muted); margin: .25rem 0 0; line-height: 1.35; }
    .btn {
      background: var(--accent);
      color: #000;
      border: none;
      border-radius: 10px;
      font-weight: 800;
      padding: .55rem 1.25rem;
      cursor: pointer;
      font-family: inherit;
    }
  `]
})
export class SettingsNotificationsComponent implements OnInit {
  prefs: UserPreferencesDto = {};
  notifyWebLive = true;

  constructor(
    private readonly users: UserService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.notifyWebLive = localStorage.getItem(LS_WEB_LIVE) !== '0';
    this.users.getPreferences().subscribe((p) => {
      this.prefs = {
        ...p,
        emailOnLive: p.emailOnLive ?? true,
        emailOnFollow: p.emailOnFollow ?? true,
        pushOnLive: p.pushOnLive ?? true
      };
    });
  }

  persistWeb(): void {
    localStorage.setItem(LS_WEB_LIVE, this.notifyWebLive ? '1' : '0');
  }

  save(): void {
    this.persistWeb();
    this.users.patchPreferences(this.prefs).subscribe({
      next: () => this.toastr.success('Notification settings saved')
    });
  }
}
