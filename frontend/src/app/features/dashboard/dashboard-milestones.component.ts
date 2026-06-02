import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface MilestoneDef {
  id: string;
  name: string;
  description: string;
  category: string;
  metricType: string;
  metricValue: number;
  rewardType: string;
  rewardAmount: number;
  rewardDetail: string;
  badgeColor: string;
  sortOrder: number;
}

interface EarnedItem {
  id: string;
  milestone: MilestoneDef;
  earnedAt: string;
  rewardPaid: boolean;
}

interface InProgressItem {
  milestone: MilestoneDef;
  currentValue: number;
  targetValue: number;
  percentage: number;
}

interface MilestoneData {
  earned: EarnedItem[];
  inProgress: InProgressItem[];
  locked: MilestoneDef[];
  summary: { totalEarned: number; totalMilestones: number };
}

@Component({
  selector: 'mado-dashboard-milestones',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  template: `
    <div class="page">
      <h1 class="mado-heading">Milestones</h1>

      @if (data) {
        <!-- Summary bar -->
        <div class="summary-bar mado-card">
          <span class="sum-txt">🏆 <strong>{{ data.summary.totalEarned }}</strong> / {{ data.summary.totalMilestones }} milestones earned</span>
          <span class="sum-sep">·</span>
          <span class="sum-txt">💰 <strong>{{ '$' }}{{ totalRewards() | number:'1.0-2' }}</strong> total rewards</span>
        </div>

        <!-- Filter tabs -->
        <div class="filter-tabs">
          <button type="button" [class.on]="filter==='all'"         (click)="filter='all'">All</button>
          <button type="button" [class.on]="filter==='earned'"      (click)="filter='earned'">✅ Earned ({{ data.earned.length }})</button>
          <button type="button" [class.on]="filter==='in-progress'" (click)="filter='in-progress'">🔄 In Progress ({{ data.inProgress.length }})</button>
          <button type="button" [class.on]="filter==='locked'"      (click)="filter='locked'">🔒 Locked ({{ data.locked.length }})</button>
        </div>

        <!-- Recently earned top section -->
        @if ((filter === 'all' || filter === 'earned') && recentlyEarned.length) {
          <div class="recent-section">
            <h3 class="section-head">Recently Earned</h3>
            <div class="recent-cards">
              @for (e of recentlyEarned; track e.id) {
                <div class="recent-card" [style.border-color]="e.milestone.badgeColor">
                  <div class="rc-icon" [style.color]="e.milestone.badgeColor">🏆</div>
                  <div class="rc-name">{{ e.milestone.name }}</div>
                  <div class="rc-date">{{ e.earnedAt | date:'mediumDate' }}</div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Milestone cards grid -->
        <div class="cards-grid">
          <!-- Earned -->
          @if (filter === 'all' || filter === 'earned') {
            @for (e of data.earned; track e.id) {
              <div class="m-card earned" [style.border-color]="e.milestone.badgeColor">
                <div class="m-cat-badge" [style.background]="catColor(e.milestone.category)">
                  {{ e.milestone.category }}
                </div>
                <div class="m-icon">🏆</div>
                <div class="m-name">{{ e.milestone.name }}</div>
                <div class="m-desc">{{ e.milestone.description }}</div>
                <div class="m-reward">{{ rewardLabel(e.milestone) }}</div>
                <div class="m-earned-badge">
                  ✅ Earned {{ e.earnedAt | date:'mediumDate' }}
                  @if (e.rewardPaid) { <span class="paid-tag">· Paid</span> }
                </div>
              </div>
            }
          }

          <!-- In progress -->
          @if (filter === 'all' || filter === 'in-progress') {
            @for (ip of data.inProgress; track ip.milestone.id) {
              <div class="m-card in-progress">
                <div class="m-cat-badge" [style.background]="catColor(ip.milestone.category)">
                  {{ ip.milestone.category }}
                </div>
                <div class="m-icon">🔄</div>
                <div class="m-name">{{ ip.milestone.name }}</div>
                <div class="m-desc">{{ ip.milestone.description }}</div>
                <div class="m-reward">{{ rewardLabel(ip.milestone) }}</div>
                <div class="m-progress-wrap">
                  <div class="m-prog-label">
                    <span>{{ ip.currentValue | number }} / {{ ip.targetValue | number }}</span>
                    <span>{{ ip.percentage }}%</span>
                  </div>
                  <div class="m-prog-track">
                    <div class="m-prog-fill" [style.width]="ip.percentage + '%'"></div>
                  </div>
                </div>
              </div>
            }
          }

          <!-- Locked -->
          @if (filter === 'all' || filter === 'locked') {
            @for (m of data.locked; track m.id) {
              <div class="m-card locked">
                <div class="m-cat-badge" [style.background]="catColor(m.category)">{{ m.category }}</div>
                <div class="m-icon lock">🔒</div>
                <div class="m-name">{{ m.name }}</div>
                <div class="m-desc">{{ m.description }}</div>
                <div class="m-reward">{{ rewardLabel(m) }}</div>
                <div class="m-target">Target: {{ m.metricValue | number }} {{ m.metricType.replace('_', ' ') }}</div>
              </div>
            }
          }
        </div>

      } @else {
        <div class="loading">Loading milestones…</div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1000px; margin: 0 auto; padding: 1rem 1rem 3rem; }
    h1 { color: var(--accent); font-size: 2rem; margin: 0 0 1.25rem; }

    .summary-bar {
      display: flex; align-items: center; gap: 1rem; padding: .85rem 1.25rem;
      margin-bottom: 1.25rem; flex-wrap: wrap;
    }
    .sum-txt { font-size: .95rem; }
    .sum-sep { color: var(--text-muted); }

    .filter-tabs { display: flex; gap: .5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .filter-tabs button {
      background: var(--bg-tertiary); border: 1px solid var(--border);
      color: var(--text-secondary); padding: .4rem .9rem; border-radius: 999px;
      cursor: pointer; font-weight: 700; font-family: inherit; font-size: .84rem;
    }
    .filter-tabs button.on { background: var(--accent); color: #000; border-color: var(--accent); }

    .section-head { font-size: .95rem; font-weight: 800; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: .05em; margin: 0 0 .75rem; }
    .recent-section { margin-bottom: 1.5rem; }
    .recent-cards { display: flex; gap: 1rem; flex-wrap: wrap; }
    .recent-card {
      border: 2px solid var(--border); border-radius: 12px; padding: .85rem 1rem;
      min-width: 140px; text-align: center; background: var(--bg-card);
    }
    .rc-icon { font-size: 1.5rem; margin-bottom: .25rem; }
    .rc-name { font-weight: 800; font-size: .9rem; }
    .rc-date { font-size: .75rem; color: var(--text-muted); margin-top: .25rem; }

    .cards-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem;
    }
    .m-card {
      border: 1px solid var(--border); border-radius: 14px; padding: 1rem;
      background: var(--bg-card); display: flex; flex-direction: column; gap: .5rem;
      transition: box-shadow .15s;
    }
    .m-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.3); }
    .m-card.locked { opacity: .6; }
    .m-card.earned { border-color: rgba(83,252,24,.3); }

    .m-cat-badge {
      align-self: flex-start; border-radius: 4px; padding: .15rem .5rem;
      font-size: .68rem; font-weight: 800; color: #000; text-transform: uppercase;
    }
    .m-icon { font-size: 1.75rem; line-height: 1; }
    .m-icon.lock { filter: grayscale(1); }
    .m-name { font-weight: 800; font-size: .95rem; }
    .m-desc { font-size: .83rem; color: var(--text-muted); }
    .m-reward { font-size: .82rem; font-weight: 700; color: var(--accent); }
    .m-earned-badge {
      font-size: .78rem; color: #53fc18; font-weight: 700;
      background: rgba(83,252,24,.08); border-radius: 6px; padding: .25rem .5rem;
    }
    .paid-tag { color: var(--text-muted); font-weight: 400; }
    .m-target { font-size: .8rem; color: var(--text-muted); }

    .m-progress-wrap { margin-top: .25rem; }
    .m-prog-label { display: flex; justify-content: space-between; font-size: .78rem; margin-bottom: .3rem; color: var(--text-muted); }
    .m-prog-track { height: 7px; background: var(--bg-tertiary); border-radius: 999px; overflow: hidden; }
    .m-prog-fill { height: 100%; background: var(--accent); border-radius: 999px; transition: width .4s; }
    .loading { padding: 2rem; color: var(--text-muted); }
  `]
})
export class DashboardMilestonesComponent implements OnInit {
  data: MilestoneData | null = null;
  filter: 'all' | 'earned' | 'in-progress' | 'locked' = 'all';

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<MilestoneData>('/api/milestones/my').subscribe({
      next: (d) => (this.data = d),
      error: () => {}
    });
  }

  get recentlyEarned(): EarnedItem[] {
    return (this.data?.earned ?? []).slice(0, 3);
  }

  totalRewards(): number {
    return (this.data?.earned ?? []).reduce(
      (s, e) => s + (e.milestone.rewardAmount ?? 0), 0
    );
  }

  rewardLabel(m: MilestoneDef): string {
    if (m.rewardType === 'CASH' && m.rewardAmount > 0) return `💰 $${m.rewardAmount} cash reward`;
    if (m.rewardType === 'BADGE') return '🏅 Badge reward';
    if (m.rewardType === 'FEATURE') return '⭐ Featured placement';
    return m.rewardDetail ?? '';
  }

  catColor(cat: string): string {
    const map: Record<string, string> = {
      HOURS: '#ff9800', VIEWERS: '#2196f3', FOLLOWERS: '#53fc18',
      SUBSCRIBERS: '#9c27b0', CLIPS: '#e53935', STREAMS: '#00bcd4'
    };
    return map[cat] ?? '#607d8b';
  }
}
