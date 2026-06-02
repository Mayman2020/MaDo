import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'mado-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="wrap">
      <div class="code">404</div>
      <h1 class="headline">Stream not found</h1>
      <p class="sub">This stream has ended… or never existed.</p>
      <div class="actions">
        <a routerLink="/" class="btn-primary">Back to Home</a>
        <a routerLink="/browse" class="btn-secondary">Browse Live</a>
      </div>
    </div>
  `,
  styles: [`
    .wrap {
      min-height: 65vh; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: .85rem; padding: 2rem; text-align: center;
    }
    .code {
      font-size: 7rem; font-weight: 900; line-height: 1;
      color: var(--accent); opacity: .15; letter-spacing: -.04em;
    }
    .headline { font-size: 2rem; margin: -.5rem 0 0; color: var(--text-primary); }
    .sub { color: var(--text-secondary); margin: 0; font-size: 1.05rem; }
    .actions { display: flex; gap: .75rem; flex-wrap: wrap; justify-content: center; margin-top: .5rem; }
    .btn-primary {
      background: var(--accent); color: #000; font-weight: 800;
      padding: .55rem 1.35rem; border-radius: 10px; text-decoration: none;
    }
    .btn-secondary {
      background: var(--bg-tertiary); color: var(--text-primary); font-weight: 700;
      padding: .55rem 1.35rem; border-radius: 10px; text-decoration: none;
      border: 1px solid var(--border);
    }
    .btn-secondary:hover { border-color: var(--accent); color: var(--accent); }
  `]
})
export class NotFoundComponent {}
