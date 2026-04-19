import { Component } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'mado-settings-connections',
  standalone: true,
  template: `
    <h2 class="section-title">Connections</h2>
    <section class="mado-card block">
      <h3>Recommended connections</h3>
      <div class="conn">
        <div class="icon">🎮</div>
        <div class="body">
          <div class="name">Discord</div>
          <p class="muted">Connect Discord to sync roles (OAuth not wired in this build).</p>
        </div>
        <button type="button" class="btn" (click)="stub()">Connect</button>
      </div>
    </section>
    <section class="mado-card block empty">
      <h3>Extensions</h3>
      <p class="placeholder">Your account has not been linked to any extensions yet.</p>
    </section>
  `,
  styles: [`
    .section-title { font-size: 1.35rem; margin: 0 0 1rem; color: var(--text-primary); }
    h3 { font-size: 1rem; margin: 0 0 1rem; color: var(--text-secondary); }
    .block { padding: 1.25rem; margin-bottom: 1rem; }
    .conn {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: var(--bg-tertiary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .body { flex: 1; min-width: 200px; }
    .name { font-weight: 800; }
    .muted { color: var(--text-secondary); font-size: .88rem; margin: .25rem 0 0; line-height: 1.4; }
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
    .empty .placeholder {
      color: var(--text-muted);
      text-align: center;
      padding: 2rem 1rem;
      margin: 0;
    }
  `]
})
export class SettingsConnectionsComponent {
  constructor(private readonly toastr: ToastrService) {}

  stub(): void {
    this.toastr.info('OAuth integrations are not configured in this build.');
  }
}
