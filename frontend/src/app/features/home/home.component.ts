import { Component } from '@angular/core';

@Component({
  selector: 'mado-home',
  standalone: true,
  template: `
    <section class="hero mado-card">
      <h1 class="mado-heading">MaDo Live Streaming Platform</h1>
      <p>Phase 1 foundation is ready. Authentication and platform infrastructure are wired.</p>
    </section>
  `,
  styles: [`
    .hero {
      padding: 2rem;
      max-width: 900px;
      margin: 3rem auto;
    }
    h1 {
      margin: 0 0 .5rem;
      font-size: 3rem;
      color: var(--accent);
    }
    p {
      margin: 0;
      color: var(--text-secondary);
    }
  `]
})
export class HomeComponent {}
