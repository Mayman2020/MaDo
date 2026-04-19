import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EngagementService, PollDto, PredictionDto } from '../../../core/services/engagement.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'mado-channel-engagement',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="stack">
      <section class="block mado-card">
        <h3>Polls</h3>
        @if (isOwner) {
          <div class="create">
            <input [(ngModel)]="pollTitle" placeholder="Poll title" />
            <textarea [(ngModel)]="pollOptionsText" rows="3" placeholder="One option per line"></textarea>
            <button type="button" class="btn" (click)="createPoll()">Start poll</button>
          </div>
        }
        @for (p of polls; track p.id) {
          <div class="item">
            <div class="item-title">{{ p.title }}</div>
            @for (o of p.options; track o.id) {
              <button type="button" class="opt" (click)="vote(p.id, o.id)" [disabled]="p.status !== 'ACTIVE'">
                {{ o.title }} — {{ o.voteCount ?? 0 }}
              </button>
            }
            @if (isOwner && p.status === 'ACTIVE') {
              <button type="button" class="link" (click)="endPoll(p.id)">End poll</button>
            }
          </div>
        } @empty {
          <p class="muted">No active polls</p>
        }
      </section>

      <section class="block mado-card">
        <h3>Predictions</h3>
        @if (isOwner) {
          <div class="create">
            <input [(ngModel)]="predTitle" placeholder="Prediction title" />
            <textarea [(ngModel)]="predOptionsText" rows="3" placeholder="Outcomes, one per line"></textarea>
            <button type="button" class="btn" (click)="createPred()">Create</button>
          </div>
        }
        @for (pr of predictions; track pr.id) {
          <div class="item">
            <div class="item-title">{{ pr.title }} <span class="muted">({{ pr.status }})</span></div>
            @if (pr.status === 'ACTIVE' && loggedIn && !isOwner) {
              <div class="bet-row">
                <input type="number" [(ngModel)]="betPoints[pr.id]" min="1" placeholder="Points" />
                @for (o of pr.options; track o.id) {
                  <button type="button" class="opt" (click)="bet(pr.id, o.id)">Bet on {{ o.title }}</button>
                }
              </div>
            }
            @if (isOwner && pr.status === 'ACTIVE') {
              <div class="resolve">
                @for (o of pr.options; track o.id) {
                  <button type="button" class="btn-sm" (click)="resolve(pr.id, o.id)">Win: {{ o.title }}</button>
                }
                <button type="button" class="link" (click)="cancelPred(pr.id)">Cancel</button>
              </div>
            }
          </div>
        } @empty {
          <p class="muted">No predictions</p>
        }
      </section>

      <section class="block mado-card">
        <h3>Channel points</h3>
        @if (loggedIn) {
          <p class="bal">Your balance: <strong>{{ balance?.points ?? '—' }}</strong></p>
          <div class="rewards">
            @for (r of rewards; track r.id) {
              <div class="rw">
                <span>{{ r.title }} ({{ r.cost }} pts)</span>
                <button type="button" class="btn-sm" (click)="redeem(r.id)">Redeem</button>
              </div>
            } @empty {
              <p class="muted">No rewards yet</p>
            }
          </div>
        } @else {
          <p class="muted">Log in to earn and redeem channel points.</p>
        }
      </section>

      <section class="block mado-card">
        <h3>Tip the streamer</h3>
        @if (loggedIn && !isOwner) {
          <div class="tip">
            <input type="number" [(ngModel)]="tipAmount" min="1" step="0.01" placeholder="Amount" />
            <input [(ngModel)]="tipMessage" placeholder="Message (optional)" />
            <button type="button" class="btn" (click)="tip()">Send tip</button>
          </div>
        } @else if (isOwner) {
          <p class="muted">Viewers can send tips here.</p>
        } @else {
          <p class="muted">Log in to tip.</p>
        }
      </section>
    </div>
  `,
  styles: [`
    .stack { display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; }
    .block { padding: 1rem; }
    h3 { margin: 0 0 .75rem; font-size: 1rem; color: var(--accent); }
    .create { display: flex; flex-direction: column; gap: .5rem; margin-bottom: 1rem; }
    input, textarea {
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text-primary);
      padding: .5rem .65rem;
      font-family: inherit;
    }
    .btn {
      align-self: flex-start;
      background: var(--accent);
      color: #000;
      border: none;
      border-radius: 8px;
      font-weight: 800;
      padding: .45rem 1rem;
      cursor: pointer;
      font-family: inherit;
    }
    .btn-sm {
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      color: var(--accent);
      border-radius: 6px;
      padding: .2rem .5rem;
      cursor: pointer;
      font-size: .8rem;
    }
    .item { margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border); }
    .item:last-child { border-bottom: none; }
    .item-title { font-weight: 700; margin-bottom: .5rem; }
    .opt {
      display: block;
      width: 100%;
      text-align: left;
      margin: .25rem 0;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      color: var(--text-primary);
      border-radius: 8px;
      padding: .4rem .65rem;
      cursor: pointer;
      font-family: inherit;
    }
    .opt:disabled { opacity: .5; cursor: not-allowed; }
    .link {
      background: none;
      border: none;
      color: var(--warning);
      cursor: pointer;
      font-size: .85rem;
      margin-top: .35rem;
      font-family: inherit;
    }
    .muted { color: var(--text-muted); font-size: .9rem; margin: 0; }
    .bet-row { display: flex; flex-direction: column; gap: .35rem; }
    .resolve { display: flex; flex-wrap: wrap; gap: .35rem; margin-top: .35rem; }
    .bal { margin: 0 0 .5rem; }
    .rewards .rw { display: flex; justify-content: space-between; align-items: center; gap: .5rem; margin: .35rem 0; font-size: .9rem; }
    .tip { display: flex; flex-direction: column; gap: .5rem; }
  `]
})
export class ChannelEngagementComponent implements OnInit, OnChanges {
  @Input({ required: true }) username!: string;
  @Input() isOwner = false;

  polls: PollDto[] = [];
  predictions: PredictionDto[] = [];
  balance: { points: number | null } | null = null;
  rewards: { id: string; title: string; cost: number | null }[] = [];

  pollTitle = '';
  pollOptionsText = '';
  predTitle = '';
  predOptionsText = '';
  betPoints: Record<string, number> = {};
  tipAmount: number | null = null;
  tipMessage = '';

  loggedIn = false;

  constructor(
    private readonly engagement: EngagementService,
    private readonly auth: AuthService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loggedIn = !!this.auth.getAccessToken();
    this.refresh();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['username'] && !changes['username'].firstChange) {
      this.refresh();
    }
  }

  refresh(): void {
    if (!this.username) {
      return;
    }
    this.engagement.polls(this.username).subscribe((p) => (this.polls = p ?? []));
    this.engagement.predictions(this.username).subscribe((p) => (this.predictions = p ?? []));
    this.engagement.rewards(this.username).subscribe((r) => (this.rewards = r ?? []));
    if (this.loggedIn) {
      this.engagement.pointBalance(this.username).subscribe((b) => (this.balance = b));
    }
  }

  createPoll(): void {
    const lines = this.pollOptionsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!this.pollTitle.trim() || lines.length < 2) {
      this.toastr.warning('Need a title and at least two options');
      return;
    }
    this.engagement.createPoll(this.username, { title: this.pollTitle.trim(), optionTitles: lines }).subscribe({
      next: () => {
        this.toastr.success('Poll created');
        this.pollTitle = '';
        this.pollOptionsText = '';
        this.refresh();
      }
    });
  }

  vote(pollId: string, optionId: string): void {
    this.engagement.votePoll(this.username, pollId, optionId).subscribe({ next: () => this.refresh() });
  }

  endPoll(pollId: string): void {
    this.engagement.endPoll(this.username, pollId).subscribe({ next: () => this.refresh() });
  }

  createPred(): void {
    const lines = this.predOptionsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!this.predTitle.trim() || lines.length < 2) {
      this.toastr.warning('Need a title and at least two outcomes');
      return;
    }
    this.engagement.createPrediction(this.username, { title: this.predTitle.trim(), optionTitles: lines }).subscribe({
      next: () => {
        this.toastr.success('Prediction created');
        this.predTitle = '';
        this.predOptionsText = '';
        this.refresh();
      }
    });
  }

  bet(predictionId: string, optionId: string): void {
    const pts = this.betPoints[predictionId] ?? 0;
    if (pts < 1) {
      this.toastr.warning('Enter points to wager');
      return;
    }
    this.engagement.betPrediction(this.username, predictionId, { optionId, pointsWagered: pts }).subscribe({
      next: () => {
        this.toastr.success('Bet placed');
        this.refresh();
      }
    });
  }

  resolve(predictionId: string, winningOptionId: string): void {
    this.engagement.resolvePrediction(this.username, predictionId, winningOptionId).subscribe({ next: () => this.refresh() });
  }

  cancelPred(predictionId: string): void {
    this.engagement.cancelPrediction(this.username, predictionId).subscribe({ next: () => this.refresh() });
  }

  redeem(rewardId: string): void {
    this.engagement.redeemReward(this.username, rewardId).subscribe({
      next: () => {
        this.toastr.success('Redeemed');
        this.refresh();
      }
    });
  }

  tip(): void {
    const a = this.tipAmount;
    if (a == null || a < 0.01) {
      this.toastr.warning('Enter a valid amount');
      return;
    }
    this.engagement.donate(this.username, { amount: a, message: this.tipMessage || undefined }).subscribe({
      next: () => {
        this.toastr.success('Thanks for the tip!');
        this.tipAmount = null;
        this.tipMessage = '';
      }
    });
  }
}
