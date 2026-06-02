import { DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../core/services/auth.service';

interface RewardRow {
  id: string;
  title: string;
  description: string | null;
  cost: number;
  isEnabled: boolean;
  imageUrl: string | null;
  maxPerStream: number | null;
  maxPerUser: number | null;
  redemptionCount: number;
}

@Component({
  selector: 'mado-dashboard-channel-points',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  template: `
    <div class="page">
      <h1 class="mado-heading">Channel Points</h1>

      <section class="mado-card block">
        <h2>Rewards</h2>
        @if (rewards.length === 0) {
          <p class="muted">No rewards created yet.</p>
        } @else {
          <div class="rewards-list">
            @for (r of rewards; track r.id) {
              <div class="reward-row">
                <div class="reward-info">
                  <span class="reward-title">{{ r.title }}</span>
                  <span class="reward-cost">{{ r.cost | number }} pts</span>
                  @if (r.description) {
                    <span class="reward-desc">{{ r.description }}</span>
                  }
                  <span class="reward-count">Redeemed {{ r.redemptionCount }} times</span>
                </div>
                <div class="reward-actions">
                  <label class="toggle">
                    <input type="checkbox" [checked]="r.isEnabled" (change)="toggleReward(r)" /> Enabled
                  </label>
                  <button class="btn danger small" (click)="deleteReward(r.id)">Delete</button>
                </div>
              </div>
            }
          </div>
        }
      </section>

      <section class="mado-card block">
        <h2>Create New Reward</h2>
        <div class="col">
          <div class="field">
            <label>Title</label>
            <input [(ngModel)]="newTitle" placeholder="Song Request" />
          </div>
          <div class="field">
            <label>Description (optional)</label>
            <input [(ngModel)]="newDesc" placeholder="I'll play your song" />
          </div>
          <div class="field">
            <label>Cost (channel points)</label>
            <input type="number" [(ngModel)]="newCost" min="1" placeholder="100" />
          </div>
          <button class="btn" (click)="createReward()" [disabled]="!newTitle || !newCost">Create Reward</button>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page { max-width: 800px; margin: 0 auto; padding: 1rem 1rem 3rem; }
    h1 { color: var(--accent); font-size: 2rem; margin: 0 0 1.25rem; }
    h2 { font-size: 1.1rem; margin: 0 0 .75rem; }
    .block { padding: 1.25rem; margin-bottom: 1rem; }
    .muted { color: var(--text-muted); }
    .rewards-list { display: flex; flex-direction: column; gap: .6rem; }
    .reward-row { display: flex; align-items: center; gap: 1rem; padding: .65rem; background: var(--bg-tertiary); border-radius: 8px; flex-wrap: wrap; }
    .reward-info { flex: 1; display: flex; flex-direction: column; gap: .2rem; }
    .reward-title { font-weight: 700; }
    .reward-cost { color: var(--accent); font-size: .85rem; }
    .reward-desc { font-size: .82rem; color: var(--text-secondary); }
    .reward-count { font-size: .75rem; color: var(--text-muted); }
    .reward-actions { display: flex; align-items: center; gap: .5rem; }
    .toggle { display: flex; align-items: center; gap: .35rem; font-size: .85rem; cursor: pointer; }
    .col { display: flex; flex-direction: column; gap: .75rem; max-width: 420px; }
    .field { display: grid; gap: .3rem; }
    label { font-size: .85rem; color: var(--text-secondary); }
    input { background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); padding: .5rem .65rem; font-family: inherit; }
    .btn { border: none; border-radius: 8px; background: var(--accent); color: #000; font-weight: 700; padding: .5rem 1rem; cursor: pointer; font-family: inherit; }
    .btn:disabled { opacity: .5; cursor: default; }
    .btn.danger { background: transparent; border: 1px solid var(--danger); color: var(--danger); }
    .btn.small { padding: .25rem .6rem; font-size: .78rem; }
  `]
})
export class DashboardChannelPointsComponent implements OnInit {
  rewards: RewardRow[] = [];
  newTitle = '';
  newDesc = '';
  newCost: number | null = 100;

  constructor(
    private readonly auth: AuthService,
    private readonly http: HttpClient,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const u = this.auth.currentUser$.value;
    if (!u) return;
    this.http.get<RewardRow[]>(`/api/channels/${u.username}/points/rewards`).subscribe({
      next: (r) => (this.rewards = r ?? []),
      error: () => {}
    });
  }

  createReward(): void {
    const u = this.auth.currentUser$.value;
    if (!u || !this.newTitle || !this.newCost) return;
    const body = { title: this.newTitle, description: this.newDesc || null, cost: this.newCost };
    this.http.post<RewardRow>(`/api/channels/${u.username}/points/rewards`, body).subscribe({
      next: (r) => {
        this.rewards.push(r);
        this.newTitle = ''; this.newDesc = ''; this.newCost = 100;
        this.toastr.success('Reward created');
      },
      error: () => this.toastr.error('Could not create reward')
    });
  }

  toggleReward(r: RewardRow): void {
    const u = this.auth.currentUser$.value;
    if (!u) return;
    const newVal = !r.isEnabled;
    this.http.patch(`/api/channels/${u.username}/points/rewards/${r.id}`, { isEnabled: newVal }).subscribe({
      next: () => { r.isEnabled = newVal; },
      error: () => this.toastr.error('Could not update reward')
    });
  }

  deleteReward(id: string): void {
    const u = this.auth.currentUser$.value;
    if (!u || !confirm('Delete this reward?')) return;
    this.http.delete(`/api/channels/${u.username}/points/rewards/${id}`).subscribe({
      next: () => {
        this.rewards = this.rewards.filter(r => r.id !== id);
        this.toastr.success('Reward deleted');
      },
      error: () => this.toastr.error('Could not delete reward')
    });
  }
}
