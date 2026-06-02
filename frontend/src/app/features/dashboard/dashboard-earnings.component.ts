import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Payout {
  id: string;
  payoutType: string;
  amountUsd: number;
  status: string;
  notes: string;
  createdAt: string;
  paidAt: string | null;
  periodMonth: number | null;
  periodYear:  number | null;
}

interface EarningsSummary {
  pendingPayout:    number;
  paidThisMonth:   number;
  paidAllTime:     number;
  nextPayoutDate:  string;
  revenueBreakdown: {
    subscriptions:    number;
    monthlyBonus:     number;
    milestoneRewards: number;
  };
}

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
}

@Component({
  selector: 'mado-dashboard-earnings',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  template: `
    <div class="page">
      <h1 class="mado-heading">Earnings & Payouts</h1>

      @if (summary) {
        <!-- Summary cards -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon">💰</div>
            <div class="stat-val">{{ summary.pendingPayout | currency }}</div>
            <div class="stat-label">Pending Payout</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div class="stat-val">{{ summary.nextPayoutDate }}</div>
            <div class="stat-label">Next Payout Date</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🏦</div>
            <div class="stat-val">{{ summary.paidThisMonth | currency }}</div>
            <div class="stat-label">Paid This Month</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">💎</div>
            <div class="stat-val">{{ summary.paidAllTime | currency }}</div>
            <div class="stat-label">Paid All Time</div>
          </div>
        </div>

        <!-- Revenue breakdown -->
        <section class="mado-card block">
          <h2>Revenue Breakdown</h2>
          <div class="breakdown-bars">
            <div class="bb-item">
              <span class="bb-label">💳 Subscriptions</span>
              <div class="bb-bar-wrap">
                <div class="bb-bar" [style.width]="breakdownPct('subscriptions') + '%'"></div>
              </div>
              <span class="bb-val">{{ summary.revenueBreakdown.subscriptions | currency }}</span>
            </div>
            <div class="bb-item">
              <span class="bb-label">🎁 Monthly Bonus</span>
              <div class="bb-bar-wrap">
                <div class="bb-bar bonus" [style.width]="breakdownPct('monthlyBonus') + '%'"></div>
              </div>
              <span class="bb-val">{{ summary.revenueBreakdown.monthlyBonus | currency }}</span>
            </div>
            <div class="bb-item">
              <span class="bb-label">🏆 Milestone Rewards</span>
              <div class="bb-bar-wrap">
                <div class="bb-bar milestone" [style.width]="breakdownPct('milestoneRewards') + '%'"></div>
              </div>
              <span class="bb-val">{{ summary.revenueBreakdown.milestoneRewards | currency }}</span>
            </div>
          </div>
        </section>

        <!-- Stripe connect -->
        <section class="mado-card block stripe-card">
          <div class="stripe-icon">🏦</div>
          <div class="stripe-text">
            <strong>Connect your bank account to receive payouts</strong>
            <p>Connect with Stripe to get paid automatically on the 1st of each month.</p>
          </div>
          <button type="button" class="stripe-btn" (click)="connectStripe()">Connect with Stripe</button>
        </section>
      }

      <!-- Payout history table -->
      <section class="mado-card block">
        <h2>Payout History</h2>
        @if (history.length) {
          <table class="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              @for (p of history; track p.id) {
                <tr>
                  <td>{{ p.createdAt | date:'mediumDate' }}</td>
                  <td>{{ typeLabel(p.payoutType) }}</td>
                  <td><strong>{{ p.amountUsd | currency }}</strong></td>
                  <td>
                    <span class="status-badge" [class.paid]="p.status==='PAID'" [class.pending]="p.status==='PENDING'" [class.failed]="p.status==='FAILED'">
                      {{ p.status === 'PAID' ? '✅ PAID' : p.status === 'PENDING' ? '⏳ PENDING' : '❌ FAILED' }}
                    </span>
                  </td>
                  <td class="notes-cell">{{ p.notes || '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p class="empty-msg">No payout history yet.</p>
        }
      </section>
    </div>
  `,
  styles: [`
    .page { max-width: 900px; margin: 0 auto; padding: 1rem 1rem 3rem; }
    h1 { color: var(--accent); font-size: 2rem; margin: 0 0 1.25rem; }
    .block { padding: 1.25rem; margin-bottom: 1rem; }
    h2 { font-size: 1.05rem; margin: 0 0 1rem; }

    .stats-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
    .stat-card {
      background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px;
      padding: 1.25rem; text-align: center;
    }
    .stat-icon { font-size: 1.5rem; margin-bottom: .4rem; }
    .stat-val { font-size: 1.4rem; font-weight: 900; color: var(--text-primary); }
    .stat-label { font-size: .75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; margin-top: .25rem; }

    .breakdown-bars { display: flex; flex-direction: column; gap: .85rem; }
    .bb-item { display: flex; align-items: center; gap: .75rem; }
    .bb-label { min-width: 170px; font-size: .88rem; }
    .bb-bar-wrap { flex: 1; height: 10px; background: var(--bg-tertiary); border-radius: 999px; overflow: hidden; }
    .bb-bar { height: 100%; background: var(--accent); border-radius: 999px; transition: width .5s; }
    .bb-bar.bonus { background: #ff9800; }
    .bb-bar.milestone { background: #9c27b0; }
    .bb-val { font-weight: 700; font-size: .9rem; min-width: 70px; text-align: right; }

    .stripe-card { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .stripe-icon { font-size: 2rem; }
    .stripe-text { flex: 1; }
    .stripe-text strong { font-weight: 800; }
    .stripe-text p { margin: .25rem 0 0; font-size: .88rem; color: var(--text-muted); }
    .stripe-btn {
      background: #635bff; color: #fff; border: none; border-radius: 10px;
      padding: .6rem 1.3rem; font-weight: 800; cursor: pointer; font-family: inherit;
      white-space: nowrap;
    }

    .history-table { width: 100%; border-collapse: collapse; }
    .history-table th {
      background: var(--bg-tertiary); padding: .6rem .85rem; text-align: left;
      font-size: .75rem; text-transform: uppercase; letter-spacing: .06em;
      color: var(--text-muted); border-bottom: 1px solid var(--border);
    }
    .history-table td { padding: .65rem .85rem; border-bottom: 1px solid var(--border); font-size: .9rem; }
    .status-badge { border-radius: 6px; padding: .2rem .55rem; font-size: .78rem; font-weight: 700; }
    .status-badge.paid    { background: rgba(83,252,24,.12); color: #53fc18; }
    .status-badge.pending { background: rgba(255,152,0,.12);  color: #ff9800; }
    .status-badge.failed  { background: rgba(229,57,53,.12);  color: #e53935; }
    .notes-cell { color: var(--text-muted); font-size: .85rem; max-width: 200px; }
    .empty-msg { color: var(--text-muted); }
  `]
})
export class DashboardEarningsComponent implements OnInit {
  summary: EarningsSummary | null = null;
  history: Payout[] = [];

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<EarningsSummary>('/api/payouts/summary').subscribe({
      next: (s) => (this.summary = s),
      error: () => {}
    });
    this.http.get<Page<Payout>>('/api/payouts/history?page=0').subscribe({
      next: (p) => (this.history = p.content ?? []),
      error: () => {}
    });
  }

  connectStripe(): void {
    this.http.post<{ url: string }>('/api/payouts/connect-stripe', {}).subscribe({
      next: (r) => window.open(r.url, '_blank'),
      error: () => {}
    });
  }

  breakdownPct(key: 'subscriptions' | 'monthlyBonus' | 'milestoneRewards'): number {
    if (!this.summary) return 0;
    const b = this.summary.revenueBreakdown;
    const total = b.subscriptions + b.monthlyBonus + b.milestoneRewards;
    if (total === 0) return 0;
    return Math.round((b[key] / total) * 100);
  }

  typeLabel(type: string): string {
    const m: Record<string, string> = {
      MONTHLY_BONUS: '🎁 Monthly Bonus',
      MILESTONE_REWARD: '🏆 Milestone',
      REVENUE_SPLIT: '💳 Revenue',
      MANUAL: '✍️ Manual'
    };
    return m[type] ?? type;
  }
}
