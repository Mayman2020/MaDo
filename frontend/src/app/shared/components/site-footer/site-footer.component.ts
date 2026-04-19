import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'mado-site-footer',
  standalone: true,
  imports: [RouterLink, AsyncPipe],
  template: `
    <footer class="foot">
      <div class="foot-inner">
        <div class="brand mado-heading">MaDo Live</div>
        <div class="cols">
          <div class="col">
            <h4>Product</h4>
            <a routerLink="/browse">Browse</a>
            <a routerLink="/clips">Clips</a>
            @if (auth.isLoggedIn$ | async) {
              <a routerLink="/following">Following</a>
            }
          </div>
          <div class="col">
            <h4>Account</h4>
            <a routerLink="/login">Login</a>
            <a routerLink="/register">Register</a>
            @if (auth.isLoggedIn$ | async) {
              <a routerLink="/settings/profile">Settings</a>
            }
          </div>
          <div class="col">
            <h4>Legal</h4>
            <a href="#" (click)="$event.preventDefault()">Terms</a>
            <a href="#" (click)="$event.preventDefault()">Privacy</a>
            <a href="#" (click)="$event.preventDefault()">DMCA</a>
          </div>
          <div class="col">
            <h4>Contact</h4>
            <span class="muted">support&#64;example.com</span>
          </div>
        </div>
        <div class="bottom">
          <span class="copy">© {{ year }} MaDo Live</span>
          <div class="social" aria-label="Social">
            <span class="soc" title="X">𝕏</span>
            <span class="soc" title="Discord">⌘</span>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .foot {
      margin-top: 3rem;
      border-top: 1px solid var(--border);
      background: #050508;
      padding: 2.5rem 1rem 2rem;
    }
    .foot-inner {
      max-width: 1200px;
      margin: 0 auto;
    }
    .brand {
      color: var(--accent);
      font-size: 1.5rem;
      margin-bottom: 1.75rem;
    }
    .cols {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1.5rem 2rem;
    }
    h4 {
      margin: 0 0 .65rem;
      font-size: .78rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: .08em;
      color: var(--text-muted);
    }
    .col a {
      display: block;
      color: var(--text-secondary);
      text-decoration: none;
      font-size: .9rem;
      padding: .2rem 0;
    }
    .col a:hover { color: var(--accent); }
    .muted { font-size: .85rem; color: var(--text-muted); }
    .bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border);
    }
    .copy { font-size: .8rem; color: var(--text-muted); }
    .social { display: flex; gap: .5rem; }
    .soc {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-tertiary);
      border-radius: 8px;
      font-size: .85rem;
      color: var(--text-secondary);
      cursor: default;
    }
  `]
})
export class SiteFooterComponent {
  readonly year = new Date().getFullYear();

  constructor(readonly auth: AuthService) {}
}
