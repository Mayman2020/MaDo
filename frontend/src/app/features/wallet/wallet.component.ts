import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { loadStripe, Stripe, StripeCardElement } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

interface CoinPackage {
  coins: number;
  amountCents: number;
  label: string;
}

@Component({
  selector: 'mado-wallet',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <h1 class="mado-heading">MaDo Coins</h1>
      <p class="lead">Virtual currency for gifts, channel point boosts, and subscriptions.</p>

      @if (!loggedIn) {
        <div class="auth-wall mado-card">
          <p>You must be logged in to view your balance or purchase coins.</p>
          <a routerLink="/login" class="btn-login">Login</a>
          <a routerLink="/register" class="btn-register">Create Account</a>
        </div>
      }

      @if (loggedIn) {
      <div class="balance mado-card">
        <span class="lbl">Your balance</span>
        <strong class="amt">{{ balance | number }} coins</strong>
      </div>

      @if (!stripeReady) {
        <div class="stripe-notice mado-card">
          <span class="notice-icon">💳</span>
          <div>
            <strong>Payment processing not configured</strong>
            <p>Coin purchases are unavailable in this build. Contact the site admin to enable Stripe.</p>
          </div>
        </div>
      }

      @if (stripeReady) {
      <div class="grid">
        @for (pkg of packages; track pkg.coins) {
          <div class="tier mado-card" [class.selected]="selectedPkg?.coins === pkg.coins" (click)="selectPackage(pkg)">
            <div class="gem">💎</div>
            <div class="k">{{ pkg.coins | number }} coins</div>
            <div class="usd">{{ pkg.label }}</div>
          </div>
        }
      </div>

      @if (selectedPkg) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal mado-card" (click)="$event.stopPropagation()">
            <h2>Purchase {{ selectedPkg.coins | number }} Coins</h2>
            <p class="modal-price">{{ selectedPkg.label }}</p>
            <div id="card-element" class="stripe-card-el"></div>
            @if (cardError) { <div class="card-error">{{ cardError }}</div> }
            <div class="modal-actions">
              <button class="btn-cancel" (click)="closeModal()">Cancel</button>
              <button class="btn-buy" (click)="confirmPayment()" [disabled]="purchasing">
                {{ purchasing ? 'Processing…' : 'Buy Now' }}
              </button>
            </div>
          </div>
        </div>
      }
      } <!-- end @if stripeReady -->

      @if (successMsg) {
        <div class="toast-success">{{ successMsg }}</div>
      }
      } <!-- end @if loggedIn -->
    </div>
  `,
  styles: [`
    .page { max-width: 900px; margin: 0 auto; padding: 1rem 1rem 3rem; }
    h1 { color: var(--accent); font-size: 2rem; margin: 0 0 .5rem; }
    .lead { color: var(--text-secondary); margin: 0 0 1.5rem; }
    .balance {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.25rem; margin-bottom: 1.5rem; max-width: 360px;
    }
    .lbl { color: var(--text-secondary); font-weight: 600; }
    .amt { font-size: 1.5rem; color: var(--accent); }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem; }
    .tier {
      padding: 1rem; text-align: center; cursor: pointer; transition: border-color .15s;
      border: 2px solid transparent;
    }
    .tier:hover { border-color: var(--accent); }
    .tier.selected { border-color: var(--accent); background: rgba(83,252,24,.07); }
    .gem { font-size: 2rem; margin-bottom: .35rem; }
    .k { font-weight: 800; font-size: .95rem; }
    .usd { color: var(--text-muted); font-size: .85rem; margin-top: .25rem; }

    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,.7);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal { padding: 2rem; min-width: 360px; max-width: 480px; width: 90%; }
    .modal h2 { margin: 0 0 .25rem; color: var(--accent); }
    .modal-price { color: var(--text-secondary); margin: 0 0 1.25rem; }
    .stripe-card-el {
      background: #1a1a2e; border: 1px solid #333; border-radius: 6px;
      padding: .75rem 1rem; margin-bottom: .75rem;
    }
    .card-error { color: #ff4444; font-size: .85rem; margin-bottom: .75rem; }
    .modal-actions { display: flex; gap: .75rem; justify-content: flex-end; margin-top: 1rem; }
    .btn-cancel { background: none; border: 1px solid #555; color: var(--text-secondary); padding: .5rem 1rem; border-radius: 4px; cursor: pointer; }
    .btn-buy { background: var(--accent); color: #000; border: none; padding: .5rem 1.25rem; border-radius: 4px; font-weight: 700; cursor: pointer; }
    .btn-buy:disabled { opacity: .5; cursor: not-allowed; }
    .toast-success {
      position: fixed; bottom: 2rem; right: 2rem; background: var(--accent); color: #000;
      padding: .75rem 1.25rem; border-radius: 8px; font-weight: 700; z-index: 2000;
      animation: fadeOut 3s forwards;
    }
    @keyframes fadeOut { 0%,70% { opacity:1 } 100% { opacity:0 } }
    .auth-wall { padding: 2rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .auth-wall p { color: var(--text-muted); margin: 0; }
    .btn-login { background: var(--accent); color: #000; padding: .6rem 1.5rem; border-radius: 9px; font-weight: 800; text-decoration: none; }
    .btn-register { color: var(--accent); font-weight: 700; text-decoration: none; }
    .stripe-notice {
      display: flex; align-items: flex-start; gap: 1rem; padding: 1.25rem;
      margin-bottom: 1.5rem; border-left: 3px solid var(--accent);
    }
    .notice-icon { font-size: 1.75rem; }
    .stripe-notice strong { display: block; margin-bottom: .25rem; }
    .stripe-notice p { margin: 0; color: var(--text-secondary); font-size: .9rem; }
  `]
})
export class WalletComponent implements OnInit {
  balance = 0;
  loggedIn = false;
  selectedPkg: CoinPackage | null = null;
  purchasing = false;
  cardError = '';
  successMsg = '';

  private stripe: Stripe | null = null;
  private cardElement: StripeCardElement | null = null;
  private clientSecret = '';

  readonly packages: CoinPackage[] = [
    { coins: 500, amountCents: 529, label: '$5.29' },
    { coins: 1000, amountCents: 1055, label: '$10.55' },
    { coins: 2500, amountCents: 2649, label: '$26.49' },
    { coins: 5000, amountCents: 5299, label: '$52.99' },
    { coins: 10000, amountCents: 10529, label: '$105.29' }
  ];

  constructor(private http: HttpClient, private auth: AuthService, private router: Router) {}

  get stripeReady(): boolean {
    const k = environment.stripePublishableKey;
    return !!k && k.startsWith('pk_') && !k.includes('REPLACE');
  }

  async ngOnInit() {
    this.loggedIn = !!this.auth.currentUser$.value;
    if (this.loggedIn) {
      this.loadBalance();
      if (this.stripeReady) {
        this.stripe = await loadStripe(environment.stripePublishableKey);
      }
    }
  }

  private loadBalance() {
    this.http.get<{ balance: number }>('/api/wallet/balance').subscribe({
      next: r => this.balance = r.balance,
      error: () => {}
    });
  }

  selectPackage(pkg: CoinPackage) {
    if (!this.stripeReady) return;
    this.selectedPkg = pkg;
    this.cardError = '';
    this.clientSecret = '';
    // Delay to let modal render before mounting card element
    setTimeout(() => this.mountCard(), 50);
    // Prefetch payment intent
    this.http.post<{ clientSecret: string; coins: number }>('/api/wallet/purchase', { amountCents: pkg.amountCents }).subscribe({
      next: r => { this.clientSecret = r.clientSecret; },
      error: () => { this.cardError = 'Failed to initialize payment.'; }
    });
  }

  private mountCard() {
    if (!this.stripe) return;
    const elements = this.stripe.elements();
    this.cardElement = elements.create('card', {
      style: {
        base: { color: '#e0e0e0', fontFamily: 'monospace', fontSize: '15px', '::placeholder': { color: '#666' } }
      }
    });
    const el = document.getElementById('card-element');
    if (el) this.cardElement.mount(el);
  }

  async confirmPayment() {
    if (!this.stripe || !this.cardElement || !this.clientSecret || !this.selectedPkg) return;
    this.purchasing = true;
    this.cardError = '';
    const result = await this.stripe.confirmCardPayment(this.clientSecret, {
      payment_method: { card: this.cardElement }
    });
    this.purchasing = false;
    if (result.error) {
      this.cardError = result.error.message ?? 'Payment failed';
    } else if (result.paymentIntent?.status === 'succeeded') {
      this.closeModal();
      this.successMsg = `${this.selectedPkg.coins.toLocaleString()} coins added to your balance!`;
      setTimeout(() => this.successMsg = '', 3500);
      setTimeout(() => this.loadBalance(), 1500);
    }
  }

  closeModal() {
    if (this.cardElement) {
      this.cardElement.unmount();
      this.cardElement = null;
    }
    this.selectedPkg = null;
    this.clientSecret = '';
    this.cardError = '';
  }
}
