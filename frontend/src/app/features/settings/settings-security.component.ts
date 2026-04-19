import { Component } from '@angular/core';

@Component({
  selector: 'mado-settings-security',
  standalone: true,
  template: `
    <h2 class="section-title">Security</h2>
    <section class="mado-card block">
      <h3>Password</h3>
      <p class="muted">Change password by signing out and using the forgot-password flow, or add a dedicated endpoint later.</p>
      <div class="row">
        <input type="password" class="inp" value="••••••••" disabled aria-hidden="true" />
        <button type="button" class="btn-secondary" disabled title="Not implemented">Change</button>
      </div>
    </section>
    <section class="mado-card block">
      <h3>Two-factor authentication</h3>
      <p class="muted">2FA adds another step when you sign in. Not wired in this build.</p>
      <button type="button" class="btn" disabled>Enable 2FA</button>
    </section>
  `,
  styles: [`
    .section-title { font-size: 1.35rem; margin: 0 0 1rem; color: var(--text-primary); }
    h3 { font-size: 1rem; margin: 0 0 .5rem; color: var(--text-secondary); }
    .block { padding: 1.25rem; margin-bottom: 1rem; }
    .muted { color: var(--text-secondary); font-size: .9rem; margin: 0 0 1rem; line-height: 1.45; }
    .row { display: flex; gap: .75rem; align-items: center; flex-wrap: wrap; }
    .inp {
      flex: 1;
      min-width: 160px;
      max-width: 320px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: .55rem .75rem;
      color: var(--text-muted);
      font-family: inherit;
    }
    .btn-secondary {
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      color: var(--text-primary);
      font-weight: 700;
      padding: .55rem 1rem;
      border-radius: 10px;
      cursor: not-allowed;
      font-family: inherit;
      opacity: .7;
    }
    .btn {
      background: var(--accent);
      color: #000;
      border: none;
      border-radius: 10px;
      font-weight: 800;
      padding: .6rem 1.25rem;
      cursor: not-allowed;
      font-family: inherit;
      opacity: .5;
    }
  `]
})
export class SettingsSecurityComponent {}
