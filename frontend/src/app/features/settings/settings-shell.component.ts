import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'mado-settings-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="page">
      <h1 class="mado-heading title">Settings</h1>
      <nav class="tabs" aria-label="Settings sections">
        <a routerLink="profile" routerLinkActive="active">Profile</a>
        <a routerLink="security" routerLinkActive="active">Security</a>
        <a routerLink="preferences" routerLinkActive="active">Preferences</a>
        <a routerLink="notifications" routerLinkActive="active">Notifications</a>
        <a routerLink="connections" routerLinkActive="active">Connections</a>
        <a routerLink="payments" routerLinkActive="active">Payment methods</a>
      </nav>
      <router-outlet />
    </div>
  `,
  styles: [`
    .page {
      max-width: 880px;
      margin: 0 auto;
      padding: 1rem 1rem 3rem;
    }
    .title {
      color: var(--accent);
      font-size: 1.75rem;
      margin: 0 0 1rem;
    }
    .tabs {
      display: flex;
      flex-wrap: wrap;
      gap: .25rem 1.25rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 1.5rem;
      padding-bottom: .5rem;
    }
    .tabs a {
      color: var(--text-secondary);
      text-decoration: none;
      font-weight: 600;
      font-size: .95rem;
      padding: .35rem 0;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
    }
    .tabs a:hover { color: var(--text-primary); }
    .tabs a.active {
      color: var(--accent);
      border-bottom-color: var(--accent);
    }
  `]
})
export class SettingsShellComponent {}
