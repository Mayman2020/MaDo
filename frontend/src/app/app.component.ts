import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'mado-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <header class="topbar">
      <a routerLink="/" class="logo mado-heading">MaDo</a>
      <nav>
        <a routerLink="/login">Login</a>
        <a routerLink="/register" class="accent">Register</a>
      </nav>
    </header>
    <main>
      <router-outlet />
    </main>
  `,
  styles: [`
    .topbar {
      height: 56px;
      position: sticky;
      top: 0;
      z-index: 5;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 1rem;
      border-bottom: 1px solid var(--border);
      background: rgba(10, 10, 15, 0.85);
      backdrop-filter: blur(10px);
    }
    .logo {
      color: var(--accent);
      text-decoration: none;
      font-size: 2rem;
      line-height: 1;
    }
    nav {
      display: flex;
      gap: 1rem;
    }
    nav a {
      color: var(--text-primary);
      text-decoration: none;
      font-weight: 600;
    }
    nav a.accent {
      color: var(--accent);
    }
    main {
      padding: 1rem;
    }
  `]
})
export class AppComponent {}
