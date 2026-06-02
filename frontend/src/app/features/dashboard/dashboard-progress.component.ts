import { DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface TierDef {
  id: string;
  name: string;
  displayName: string;
  badgeColor: string;
  minHoursMonthly: number;
  minAvgViewers: number;
  minFollowers: number;
  revenueSplit: number;
  monthlyBonusUsd: number;
  perks: string[];
}

interface ProgressData {
  currentTier: TierDef | null;
  nextTier: TierDef | null;
  progress: {
    hoursThisMonth:  { current: number; required: number; percentage: number };
    avgViewers:      { current: number; required: number; percentage: number };
    followers:       { current: number; required: number; percentage: number };
  } | null;
  daysLeftInMonth: number;
  projectedTier: string;
  totalStreamHours: number;
}

@Component({
  selector: 'mado-dashboard-progress',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    <div class="page">
      <h1 class="mado-heading">Tier & Progress</h1>

      <!-- Current tier card -->
      @if (data?.currentTier) {
        <section class="mado-card tier-card" [style.border-color]="data!.currentTier!.badgeColor">
          <div class="tier-glow" [style.background]="data!.currentTier!.badgeColor + '22'">
            <div class="tier-icon" [style.color]="data!.currentTier!.badgeColor">
              {{ tierIcon(data!.currentTier!.name) }}
            </div>
            <div class="tier-info">
              <div class="tier-label">Your current tier</div>
              <div class="tier-name" [style.color]="data!.currentTier!.badgeColor">
                {{ data!.currentTier!.displayName }}
              </div>
              <div class="tier-perks">
                <span class="perk">💰 {{ data!.currentTier!.revenueSplit }}% revenue split</span>
                @if (data!.currentTier!.monthlyBonusUsd > 0) {
                  <span class="perk">🎁 {{ '$' }}{{ data!.currentTier!.monthlyBonusUsd }}/month bonus</span>
                }
              </div>
            </div>
          </div>
        </section>
      } @else {
        <div class="loading-msg">Loading tier data…</div>
      }

      <!-- Progress to next tier -->
      @if (data?.nextTier && data?.progress) {
        <section class="mado-card block">
          <h2>Progress to <span [style.color]="data!.nextTier!.badgeColor">{{ data!.nextTier!.displayName }}</span></h2>
          <p class="hint">{{ data!.daysLeftInMonth }} days left this month · {{ data!.projectedTier }}</p>

          <div class="progress-bars">
            <div class="prog-item">
              <div class="prog-label">
                <span>⏱ Hours this month</span>
                <span>{{ data!.progress!.hoursThisMonth.current | number:'1.0-1' }} / {{ data!.progress!.hoursThisMonth.required }}h</span>
              </div>
              <div class="prog-track">
                <div class="prog-fill" [style.width]="data!.progress!.hoursThisMonth.percentage + '%'"
                     [style.background]="progColor(data!.progress!.hoursThisMonth.percentage)"></div>
              </div>
              <div class="prog-pct">{{ data!.progress!.hoursThisMonth.percentage }}%</div>
            </div>

            <div class="prog-item">
              <div class="prog-label">
                <span>👁 Avg viewers</span>
                <span>{{ data!.progress!.avgViewers.current }} / {{ data!.progress!.avgViewers.required }}</span>
              </div>
              <div class="prog-track">
                <div class="prog-fill" [style.width]="data!.progress!.avgViewers.percentage + '%'"
                     [style.background]="progColor(data!.progress!.avgViewers.percentage)"></div>
              </div>
              <div class="prog-pct">{{ data!.progress!.avgViewers.percentage }}%</div>
            </div>

            <div class="prog-item">
              <div class="prog-label">
                <span>👥 Followers</span>
                <span>{{ data!.progress!.followers.current | number }} / {{ data!.progress!.followers.required | number }}</span>
              </div>
              <div class="prog-track">
                <div class="prog-fill" [style.width]="data!.progress!.followers.percentage + '%'"
                     [style.background]="progColor(data!.progress!.followers.percentage)"></div>
              </div>
              <div class="prog-pct">{{ data!.progress!.followers.percentage }}%</div>
            </div>
          </div>
        </section>
      }

      <!-- All tiers comparison table -->
      <section class="mado-card block">
        <h2>All Tiers</h2>
        <div class="tier-table-wrap">
          <table class="tier-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th>Hours/mo</th>
                <th>Avg Viewers</th>
                <th>Followers</th>
                <th>Revenue Split</th>
                <th>Monthly Bonus</th>
              </tr>
            </thead>
            <tbody>
              @for (t of allTiers; track t.id) {
                <tr [class.current-row]="data?.currentTier?.id === t.id">
                  <td>
                    <span class="tier-badge" [style.color]="t.badgeColor">
                      {{ tierIcon(t.name) }} {{ t.displayName }}
                    </span>
                    @if (data?.currentTier?.id === t.id) {
                      <span class="you-badge">← YOU</span>
                    }
                  </td>
                  <td>{{ t.minHoursMonthly }}h</td>
                  <td>{{ t.minAvgViewers }}</td>
                  <td>{{ t.minFollowers | number }}</td>
                  <td><strong>{{ t.revenueSplit }}%</strong></td>
                  <td>{{ t.monthlyBonusUsd > 0 ? '$' + t.monthlyBonusUsd : '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <!-- Perks list for current tier -->
      @if (data?.currentTier?.perks?.length) {
        <section class="mado-card block">
          <h2>Your Current Perks</h2>
          <ul class="perks-list">
            @for (p of data!.currentTier!.perks; track p) {
              <li>✅ {{ p }}</li>
            }
          </ul>
        </section>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 800px; margin: 0 auto; padding: 1rem 1rem 3rem; }
    h1 { color: var(--accent); font-size: 2rem; margin: 0 0 1.25rem; }
    .block { padding: 1.25rem; margin-bottom: 1rem; }
    h2 { font-size: 1.05rem; margin: 0 0 1rem; }
    .hint { color: var(--text-muted); font-size: .85rem; margin-bottom: 1.25rem; }
    .loading-msg { color: var(--text-muted); padding: 2rem; }

    .tier-card { padding: 0; margin-bottom: 1rem; overflow: hidden; transition: border-color .3s; }
    .tier-glow {
      display: flex; align-items: center; gap: 1.5rem; padding: 1.5rem 1.75rem;
    }
    .tier-icon { font-size: 3rem; line-height: 1; }
    .tier-label { font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); }
    .tier-name { font-size: 2rem; font-weight: 900; line-height: 1.1; }
    .tier-perks { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .65rem; }
    .perk {
      background: rgba(255,255,255,.07); border-radius: 6px;
      padding: .2rem .55rem; font-size: .83rem; font-weight: 600;
    }

    .progress-bars { display: flex; flex-direction: column; gap: 1.25rem; }
    .prog-item {}
    .prog-label { display: flex; justify-content: space-between; font-size: .88rem; margin-bottom: .4rem; }
    .prog-track {
      height: 10px; background: var(--bg-tertiary); border-radius: 999px; overflow: hidden;
    }
    .prog-fill { height: 100%; border-radius: 999px; transition: width .5s ease; }
    .prog-pct { font-size: .78rem; color: var(--text-muted); margin-top: .25rem; text-align: right; }

    .tier-table-wrap { overflow-x: auto; }
    .tier-table { width: 100%; border-collapse: collapse; }
    .tier-table th {
      background: var(--bg-tertiary); padding: .6rem .85rem; text-align: left;
      font-size: .75rem; text-transform: uppercase; letter-spacing: .06em;
      color: var(--text-muted); border-bottom: 1px solid var(--border);
    }
    .tier-table td { padding: .65rem .85rem; border-bottom: 1px solid var(--border); font-size: .9rem; }
    .tier-table tr.current-row { background: rgba(83,252,24,.06); }
    .tier-badge { font-weight: 800; }
    .you-badge {
      background: var(--accent); color: #000; border-radius: 4px;
      padding: .1rem .4rem; font-size: .7rem; font-weight: 900; margin-left: .5rem;
    }

    .perks-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: .5rem; }
    .perks-list li { font-size: .93rem; }
  `]
})
export class DashboardProgressComponent implements OnInit {
  data: ProgressData | null = null;
  allTiers: TierDef[] = [];

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<ProgressData>('/api/tiers/my-progress').subscribe({
      next: (d) => (this.data = d),
      error: () => {}
    });
    this.http.get<TierDef[]>('/api/tiers').subscribe({
      next: (t) => (this.allTiers = t),
      error: () => {}
    });
  }

  tierIcon(name: string): string {
    const icons: Record<string, string> = {
      BRONZE: '🥉', SILVER: '🥈', GOLD: '🥇', DIAMOND: '💎', LEGEND: '👑'
    };
    return icons[name] ?? '🏅';
  }

  progColor(pct: number): string {
    if (pct >= 100) return '#53fc18';
    if (pct >= 70)  return '#ffd700';
    if (pct >= 40)  return '#ff9800';
    return '#e53935';
  }
}
