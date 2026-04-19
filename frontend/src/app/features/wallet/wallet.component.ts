import { Component } from '@angular/core';

@Component({
  selector: 'mado-wallet',
  standalone: true,
  template: `
    <div class="page">
      <h1 class="mado-heading">MaDo Coins</h1>
      <p class="lead">Virtual currency for gifts and tips — purchase flow not connected yet.</p>
      <div class="balance mado-card">
        <span class="lbl">Your balance</span>
        <strong class="amt">0</strong>
      </div>
      <div class="grid">
        @for (t of tiers; track t.k) {
          <div class="tier mado-card">
            <div class="gem">💎</div>
            <div class="k">{{ t.k }} coins</div>
            <div class="usd">{{ t.usd }}</div>
          </div>
        }
      </div>
      <p class="foot">All prices shown as placeholders (USD).</p>
    </div>
  `,
  styles: [`
    .page { max-width: 900px; margin: 0 auto; padding: 1rem 1rem 3rem; }
    h1 { color: var(--accent); font-size: 2rem; margin: 0 0 .5rem; }
    .lead { color: var(--text-secondary); margin: 0 0 1.5rem; }
    .balance {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      margin-bottom: 1.5rem;
      max-width: 360px;
    }
    .lbl { color: var(--text-secondary); font-weight: 600; }
    .amt { font-size: 1.5rem; color: var(--accent); }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 1rem;
    }
    .tier {
      padding: 1rem;
      text-align: center;
      cursor: default;
      opacity: .85;
    }
    .gem { font-size: 2rem; margin-bottom: .35rem; }
    .k { font-weight: 800; font-size: .95rem; }
    .usd { color: var(--text-muted); font-size: .85rem; margin-top: .25rem; }
    .foot { font-size: .8rem; color: var(--text-muted); margin-top: 2rem; }
  `]
})
export class WalletComponent {
  readonly tiers = [
    { k: 500, usd: '$5.29' },
    { k: 1000, usd: '$10.55' },
    { k: 2500, usd: '$26.49' },
    { k: 5000, usd: '$52.99' },
    { k: 10000, usd: '$105.29' }
  ];
}
