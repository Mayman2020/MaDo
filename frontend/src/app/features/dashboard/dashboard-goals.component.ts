import { DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';

interface Goal {
  id: string;
  title: string;
  goalType: string;
  targetValue: number;
  currentValue: number;
  rewardText: string | null;
  active: boolean;
  completed: boolean;
  createdAt: string;
}

@Component({
  selector: 'mado-dashboard-goals',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  template: `
    <div class="page">
      <h1 class="mado-heading">Community Goals</h1>
      <p class="lead">Set goals for your community — they appear on your channel page!</p>

      <!-- Active goals list -->
      @if (goals.length) {
        <section class="mado-card block">
          <h2>Active Goals</h2>
          <div class="goals-list">
            @for (g of goals; track g.id) {
              <div class="goal-item" [class.done]="g.completed">
                <div class="goal-row">
                  <div class="goal-meta">
                    <span class="goal-type-badge" [style.background]="typeColor(g.goalType)">{{ g.goalType }}</span>
                    <strong class="goal-title">{{ g.title }}</strong>
                    @if (g.rewardText) {
                      <span class="goal-reward">🎁 {{ g.rewardText }}</span>
                    }
                  </div>
                  <div class="goal-actions">
                    <button type="button" class="btn-sm secondary" (click)="markComplete(g)">✅ Complete</button>
                    <button type="button" class="btn-sm danger" (click)="deleteGoal(g)">🗑 Delete</button>
                  </div>
                </div>
                <div class="goal-prog-label">
                  <span>{{ g.currentValue | number }} / {{ g.targetValue | number }}</span>
                  <span>{{ pct(g) }}%</span>
                </div>
                <div class="goal-track">
                  <div class="goal-fill" [style.width]="pct(g) + '%'"></div>
                </div>
              </div>
            }
          </div>
        </section>
      } @else {
        <div class="mado-card block empty-state">
          <p>No active goals. Create one below to engage your community!</p>
        </div>
      }

      <!-- Create new goal form -->
      <section class="mado-card block">
        <h2>Create New Goal</h2>
        <div class="form-col">
          <div class="form-field">
            <label class="form-label">Title</label>
            <input class="form-input" [(ngModel)]="newTitle" placeholder="Reach 500 followers!" maxlength="200" />
          </div>
          <div class="form-field">
            <label class="form-label">Goal Type</label>
            <select class="form-select" [(ngModel)]="newType">
              <option value="FOLLOWERS">Followers</option>
              <option value="SUBSCRIBERS">Subscribers</option>
              <option value="HOURS">Hours Streamed</option>
              <option value="VIEWERS">Peak Viewers</option>
              <option value="DONATIONS">Donations ($)</option>
            </select>
          </div>
          <div class="form-field">
            <label class="form-label">Target Value</label>
            <input type="number" class="form-input" [(ngModel)]="newTarget" min="1" placeholder="500" />
          </div>
          <div class="form-field">
            <label class="form-label">Reward Promise (optional)</label>
            <input class="form-input" [(ngModel)]="newReward" placeholder="I'll do a 24-hour stream when we hit this!" maxlength="300" />
          </div>
          <button type="button" class="btn" (click)="createGoal()" [disabled]="saving || !newTitle.trim() || !newTarget">
            {{ saving ? 'Saving…' : 'Save Goal' }}
          </button>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page { max-width: 800px; margin: 0 auto; padding: 1rem 1rem 3rem; }
    h1 { color: var(--accent); font-size: 2rem; margin: 0 0 .25rem; }
    .lead { color: var(--text-muted); margin-bottom: 1.25rem; }
    .block { padding: 1.25rem; margin-bottom: 1rem; }
    h2 { font-size: 1.05rem; margin: 0 0 1rem; }

    .goals-list { display: flex; flex-direction: column; gap: 1rem; }
    .goal-item { border: 1px solid var(--border); border-radius: 10px; padding: 1rem; }
    .goal-item.done { opacity: .6; }
    .goal-row { display: flex; justify-content: space-between; align-items: flex-start; gap: .75rem; flex-wrap: wrap; margin-bottom: .75rem; }
    .goal-meta { display: flex; flex-direction: column; gap: .35rem; }
    .goal-type-badge { border-radius: 4px; padding: .1rem .45rem; font-size: .7rem; font-weight: 800; color: #000; align-self: flex-start; }
    .goal-title { font-weight: 800; font-size: .95rem; }
    .goal-reward { font-size: .82rem; color: var(--text-muted); }
    .goal-actions { display: flex; gap: .5rem; }
    .btn-sm {
      background: var(--bg-tertiary); border: 1px solid var(--border); color: var(--text-secondary);
      padding: .3rem .7rem; border-radius: 7px; cursor: pointer; font-family: inherit; font-size: .82rem; font-weight: 700;
    }
    .btn-sm.danger { color: var(--danger); border-color: var(--danger); }
    .btn-sm.secondary { color: var(--accent); border-color: var(--accent); }

    .goal-prog-label { display: flex; justify-content: space-between; font-size: .8rem; color: var(--text-muted); margin-bottom: .35rem; }
    .goal-track { height: 8px; background: var(--bg-tertiary); border-radius: 999px; overflow: hidden; }
    .goal-fill { height: 100%; background: var(--accent); border-radius: 999px; transition: width .4s; }

    .empty-state { color: var(--text-muted); text-align: center; }

    .form-col { display: flex; flex-direction: column; gap: .85rem; max-width: 480px; }
    .form-field { display: flex; flex-direction: column; gap: .3rem; }
    .form-label { font-size: .8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .04em; }
    .form-input, .form-select {
      background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 8px;
      color: var(--text-primary); padding: .5rem .75rem; font-family: inherit; font-size: .92rem;
    }
    .form-input:focus, .form-select:focus { outline: none; border-color: var(--accent); }
    .btn {
      background: var(--accent); color: #000; border: none; border-radius: 9px;
      padding: .6rem 1.25rem; font-weight: 800; cursor: pointer; font-family: inherit;
      align-self: flex-start;
    }
    .btn:disabled { opacity: .5; cursor: default; }
  `]
})
export class DashboardGoalsComponent implements OnInit {
  goals: Goal[] = [];
  saving = false;
  newTitle = '';
  newType = 'FOLLOWERS';
  newTarget: number | null = null;
  newReward = '';
  private channelId = '';

  constructor(
    private readonly http: HttpClient,
    private readonly auth: AuthService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const me = this.auth.currentUser$.value;
    if (!me) return;
    // Get channel ID from channel endpoint
    this.http.get<any>(`/api/channels/${me.username}`).subscribe({
      next: (ch) => {
        this.channelId = ch.id;
        this.loadGoals();
      }
    });
  }

  loadGoals(): void {
    if (!this.channelId) return;
    this.http.get<Goal[]>(`/api/goals/${this.channelId}`).subscribe({
      next: (g) => (this.goals = g),
      error: () => {}
    });
  }

  createGoal(): void {
    if (!this.newTitle.trim() || !this.newTarget) return;
    this.saving = true;
    this.http.post<Goal>('/api/goals', {
      title: this.newTitle.trim(),
      goalType: this.newType,
      targetValue: this.newTarget,
      rewardText: this.newReward.trim() || null
    }).subscribe({
      next: (g) => {
        this.goals.unshift(g);
        this.newTitle = ''; this.newTarget = null; this.newReward = '';
        this.saving = false;
        this.toastr.success('Goal created!');
      },
      error: () => { this.saving = false; this.toastr.error('Could not create goal'); }
    });
  }

  markComplete(g: Goal): void {
    this.http.patch<Goal>(`/api/goals/${g.id}/complete`, {}).subscribe({
      next: (updated) => {
        const idx = this.goals.findIndex(x => x.id === g.id);
        if (idx >= 0) this.goals.splice(idx, 1, updated);
        this.toastr.success('Goal marked complete! 🎉');
      }
    });
  }

  deleteGoal(g: Goal): void {
    if (!confirm('Delete this goal?')) return;
    this.http.delete(`/api/goals/${g.id}`).subscribe({
      next: () => {
        this.goals = this.goals.filter(x => x.id !== g.id);
        this.toastr.success('Goal deleted');
      }
    });
  }

  pct(g: Goal): number {
    if (g.targetValue === 0) return 100;
    return Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
  }

  typeColor(type: string): string {
    const m: Record<string, string> = {
      FOLLOWERS: '#53fc18', SUBSCRIBERS: '#9c27b0',
      HOURS: '#ff9800', VIEWERS: '#2196f3', DONATIONS: '#ffd700'
    };
    return m[type] ?? '#607d8b';
  }
}
