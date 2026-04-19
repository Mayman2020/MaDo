import { Component } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'mado-settings-payments',
  standalone: true,
  template: `
    <h2 class="section-title">Payment methods</h2>
    <p class="muted">Saved cards and wallets will appear here when Stripe (or similar) is connected.</p>
    <button type="button" class="add" (click)="stub()">
      <span class="plus">+</span> Add new card
    </button>
  `,
  styles: [`
    .section-title { font-size: 1.35rem; margin: 0 0 .75rem; color: var(--text-primary); }
    .muted { color: var(--text-secondary); font-size: .9rem; margin: 0 0 1.5rem; line-height: 1.45; }
    .add {
      display: inline-flex;
      align-items: center;
      gap: .5rem;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      color: var(--text-primary);
      font-weight: 700;
      padding: .65rem 1.25rem;
      border-radius: 10px;
      cursor: pointer;
      font-family: inherit;
      font-size: .95rem;
    }
    .add:hover { border-color: var(--accent); color: var(--accent); }
    .plus { font-size: 1.25rem; font-weight: 400; opacity: .85; }
  `]
})
export class SettingsPaymentsComponent {
  constructor(private readonly toastr: ToastrService) {}

  stub(): void {
    this.toastr.info('Payments are not wired in this build.');
  }
}
