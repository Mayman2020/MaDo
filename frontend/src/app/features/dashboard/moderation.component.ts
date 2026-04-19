import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ModerationService, BanRow, BannedWordRow, ModeratorRow } from '../../core/services/moderation.service';

@Component({
  selector: 'mado-moderation',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <h1 class="mado-heading">Moderation</h1>
      <p class="lead">Manage {{ username }}’s channel</p>

      <section class="mado-card block">
        <h2>Ban user</h2>
        <form [formGroup]="banForm" (ngSubmit)="submitBan()" class="grid-form">
          <input formControlName="targetUsername" placeholder="Username to ban" />
          <input formControlName="reason" placeholder="Reason" />
          <label class="chk"><input type="checkbox" formControlName="permanent" /> Permanent</label>
          <input formControlName="timeoutMinutes" type="number" placeholder="Timeout minutes (if not permanent)" />
          <button type="submit" class="btn" [disabled]="banForm.invalid">Ban</button>
        </form>
        <table>
          <thead><tr><th>User</th><th>Reason</th><th></th></tr></thead>
          <tbody>
            @for (b of bans; track b.id) {
              <tr>
                <td>{{ banTarget(b) }}</td>
                <td>{{ b.reason }}</td>
                <td><button type="button" class="link" (click)="unban(b.id)">Remove</button></td>
              </tr>
            } @empty {
              <tr><td colspan="3" class="muted">No active bans listed</td></tr>
            }
          </tbody>
        </table>
      </section>

      <section class="mado-card block">
        <h2>Banned words</h2>
        <div class="row">
          <input [(ngModel)]="newWord" [ngModelOptions]="{standalone: true}" placeholder="Add word" />
          <button type="button" class="btn" (click)="addWord()">Add</button>
        </div>
        <ul class="tags">
          @for (w of words; track w.id) {
            <li>
              {{ w.word }}
              <button type="button" class="x" (click)="removeWord(w.id)">×</button>
            </li>
          }
        </ul>
      </section>

      <section class="mado-card block">
        <h2>Moderators</h2>
        <div class="row">
          <input [(ngModel)]="modUserId" [ngModelOptions]="{standalone: true}" placeholder="User UUID to promote" />
          <button type="button" class="btn" (click)="addMod()">Add moderator</button>
        </div>
        <ul>
          @for (m of mods; track m.id) {
            <li>
              {{ modName(m) }}
              <button type="button" class="link" (click)="removeMod(m)">Remove</button>
            </li>
          } @empty {
            <li class="muted">No moderators</li>
          }
        </ul>
      </section>
    </div>
  `,
  styles: [`
    .page { max-width: 900px; margin: 0 auto; padding: 1rem 1rem 3rem; }
    h1 { color: var(--accent); font-size: 2rem; margin: 0 0 .25rem; }
    .lead { color: var(--text-secondary); margin-bottom: 1.5rem; }
    h2 { font-size: 1.1rem; margin: 0 0 1rem; }
    .block { padding: 1.25rem; margin-bottom: 1.25rem; }
    .grid-form { display: grid; gap: .5rem; margin-bottom: 1rem; max-width: 420px; }
    input {
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text-primary);
      padding: .5rem .65rem;
      font-family: inherit;
    }
    .chk { color: var(--text-secondary); font-size: .9rem; }
    .btn {
      background: var(--accent);
      color: #000;
      border: none;
      border-radius: 8px;
      font-weight: 800;
      padding: .5rem 1rem;
      cursor: pointer;
      font-family: inherit;
    }
    .btn:disabled { opacity: .5; }
    table { width: 100%; border-collapse: collapse; font-size: .9rem; }
    th, td { text-align: left; padding: .5rem; border-bottom: 1px solid var(--border); }
    .link {
      background: none;
      border: none;
      color: var(--warning);
      cursor: pointer;
      font-family: inherit;
    }
    .muted { color: var(--text-muted); }
    .row { display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .tags { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: .5rem; }
    .tags li {
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: .25rem .65rem;
      font-size: .85rem;
      display: flex;
      align-items: center;
      gap: .35rem;
    }
    .x {
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
    }
  `]
})
export class ModerationDashboardComponent implements OnInit {
  username = '';
  bans: BanRow[] = [];
  words: BannedWordRow[] = [];
  mods: ModeratorRow[] = [];
  newWord = '';
  modUserId = '';

  banForm = this.fb.nonNullable.group({
    targetUsername: ['', Validators.required],
    reason: [''],
    permanent: [false],
    timeoutMinutes: [null as number | null]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly mod: ModerationService
  ) {}

  ngOnInit(): void {
    const u = this.auth.currentUser$.value;
    if (!u) {
      return;
    }
    this.username = u.username;
    this.reload();
  }

  reload(): void {
    if (!this.username) {
      return;
    }
    this.mod.listBans(this.username).subscribe((b) => (this.bans = b ?? []));
    this.mod.listWords(this.username).subscribe((w) => (this.words = w ?? []));
    this.mod.listMods(this.username).subscribe((m) => (this.mods = m ?? []));
  }

  banTarget(b: BanRow): string {
    const x = b as unknown as { bannedUser?: { username: string } };
    return x.bannedUser?.username ?? '—';
  }

  modName(m: ModeratorRow): string {
    return m.user?.username ?? m.id;
  }

  submitBan(): void {
    if (this.banForm.invalid) {
      return;
    }
    const v = this.banForm.getRawValue();
    this.mod
      .ban(this.username, {
        targetUsername: v.targetUsername,
        reason: v.reason || undefined,
        permanent: v.permanent,
        timeoutMinutes: v.timeoutMinutes ?? undefined
      })
      .subscribe({ next: () => this.reload() });
  }

  unban(id: string): void {
    this.mod.unban(this.username, id).subscribe({ next: () => this.reload() });
  }

  addWord(): void {
    const w = this.newWord.trim();
    if (!w) {
      return;
    }
    this.mod.addWord(this.username, w).subscribe({ next: () => { this.newWord = ''; this.reload(); } });
  }

  removeWord(id: string): void {
    this.mod.removeWord(this.username, id).subscribe({ next: () => this.reload() });
  }

  addMod(): void {
    const id = this.modUserId.trim();
    if (!id) {
      return;
    }
    this.mod.addMod(this.username, id).subscribe({ next: () => { this.modUserId = ''; this.reload(); } });
  }

  removeMod(m: ModeratorRow): void {
    const uid = m.user?.id;
    if (!uid) {
      return;
    }
    this.mod.removeMod(this.username, uid).subscribe({ next: () => this.reload() });
  }
}
