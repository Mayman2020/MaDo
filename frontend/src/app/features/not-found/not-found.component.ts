import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'mado-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="wrap">
      <h1 class="mado-heading">404</h1>
      <p>Page not found.</p>
      <a routerLink="/" class="cta">Back home</a>
    </div>
  `,
  styles: [`
    .wrap {
      min-height: 50vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: .75rem;
      padding: 2rem;
      text-align: center;
    }
    h1 { font-size: 4rem; color: var(--accent); margin: 0; }
    p { color: var(--text-secondary); margin: 0; }
    .cta {
      margin-top: .5rem;
      display: inline-block;
      background: var(--accent);
      color: #000;
      font-weight: 800;
      padding: .5rem 1.25rem;
      border-radius: 8px;
      text-decoration: none;
    }
  `]
})
export class NotFoundComponent {}
