import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../core/services/auth.service';

interface ModRow { id: string; user?: { id: string; username: string; avatarUrl?: string; }; }
interface BanRow { id: string; bannedUserId?: string; reason?: string; isPermanent?: boolean; isTimeout?: boolean; }

@Component({
  selector: 'mado-dashboard-moderators',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="page">
      <h1 class="mado-heading">Moderators & Bans</h1>

      <section class="mado-card block">
        <h2>Moderators</h2>
        @if (mods.length === 0) {
          <p class="muted">No moderators added yet.</p>
        } @else {
          <ul class="mod-list">
            @for (m of mods; track m.id) {
              <li class="mod-row">
                <span class="mod-name">&#64;{{ m.user?.username || 'Unknown' }}</span>
                <button class="btn danger small" (click)="removeMod(m)">Remove</button>
              </li>
            }
          </ul>
        }
        <div class="add-mod-row">
          <input [(ngModel)]="addModQuery" placeholder="Search by username" />
          <button class="btn" (click)="addMod()" [disabled]="!addModQuery.trim()">Add Moderator</button>
        </div>
      </section>

      <section class="mado-card block">
        <h2>Active Bans</h2>
        @if (bans.length === 0) {
          <p class="muted">No active bans.</p>
        } @else {
          <ul class="ban-list">
            @for (b of bans; track b.id) {
              <li class="ban-row">
                <span>User ID: {{ b.bannedUserId }}</span>
                <span class="ban-reason">{{ b.reason || 'No reason given' }}</span>
                <span [class]="b.isPermanent ? 'tag danger' : 'tag'">{{ b.isPermanent ? 'Permanent' : 'Timeout' }}</span>
                <button class="btn secondary small" (click)="unban(b.id)">Unban</button>
              </li>
            }
          </ul>
        }
      </section>
    </div>
  `,
  styles: [`
    .page { max-width: 800px; margin: 0 auto; padding: 1rem 1rem 3rem; }
    h1 { color: var(--accent); font-size: 2rem; margin: 0 0 1.25rem; }
    h2 { font-size: 1.1rem; margin: 0 0 .75rem; }
    .block { padding: 1.25rem; margin-bottom: 1rem; }
    .muted { color: var(--text-muted); }
    .mod-list, .ban-list { list-style: none; padding: 0; margin: 0 0 1rem; }
    .mod-row, .ban-row { display: flex; align-items: center; gap: .75rem; padding: .5rem 0; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
    .mod-name { font-weight: 700; flex: 1; }
    .ban-reason { flex: 1; color: var(--text-secondary); font-size: .85rem; }
    .tag { background: var(--bg-tertiary); border-radius: 4px; padding: 2px 8px; font-size: .75rem; }
    .tag.danger { background: rgba(255,65,65,.15); color: var(--danger); }
    .add-mod-row { display: flex; gap: .5rem; flex-wrap: wrap; margin-top: .75rem; }
    .add-mod-row input { flex: 1; min-width: 160px; }
    input { background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); padding: .5rem .65rem; font-family: inherit; }
    .btn { border: none; border-radius: 8px; background: var(--accent); color: #000; font-weight: 700; padding: .5rem 1rem; cursor: pointer; font-family: inherit; }
    .btn:disabled { opacity: .5; cursor: default; }
    .btn.danger { background: transparent; border: 1px solid var(--danger); color: var(--danger); }
    .btn.secondary { background: var(--bg-tertiary); border: 1px solid var(--border); color: var(--text-primary); }
    .btn.small { padding: .25rem .6rem; font-size: .78rem; }
  `]
})
export class DashboardModeratorsComponent implements OnInit {
  mods: ModRow[] = [];
  bans: BanRow[] = [];
  addModQuery = '';

  constructor(
    private readonly auth: AuthService,
    private readonly http: HttpClient,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const u = this.auth.currentUser$.value;
    if (!u) return;
    this.http.get<ModRow[]>(`/api/channels/${u.username}/moderation/moderators`).subscribe({
      next: (m) => (this.mods = m ?? []),
      error: () => {}
    });
    this.http.get<BanRow[]>(`/api/channels/${u.username}/moderation/bans`).subscribe({
      next: (b) => (this.bans = b ?? []),
      error: () => {}
    });
  }

  addMod(): void {
    const u = this.auth.currentUser$.value;
    if (!u || !this.addModQuery.trim()) return;
    this.http.post<ModRow>(`/api/channels/${u.username}/moderation/moderators`, { username: this.addModQuery.trim() }).subscribe({
      next: (m) => {
        this.mods.push(m);
        this.addModQuery = '';
        this.toastr.success('Moderator added');
      },
      error: () => this.toastr.error('Could not add moderator')
    });
  }

  removeMod(mod: ModRow): void {
    const u = this.auth.currentUser$.value;
    if (!u || !confirm('Remove this moderator?')) return;
    this.http.delete(`/api/channels/${u.username}/moderation/moderators/${mod.user?.id ?? mod.id}`).subscribe({
      next: () => {
        this.mods = this.mods.filter(m => m.id !== mod.id);
        this.toastr.success('Moderator removed');
      },
      error: () => this.toastr.error('Could not remove moderator')
    });
  }

  unban(banId: string): void {
    const u = this.auth.currentUser$.value;
    if (!u || !confirm('Unban this user?')) return;
    this.http.delete(`/api/channels/${u.username}/moderation/bans/${banId}`).subscribe({
      next: () => {
        this.bans = this.bans.filter(b => b.id !== banId);
        this.toastr.success('User unbanned');
      },
      error: () => this.toastr.error('Could not unban user')
    });
  }
}
