import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserService, UserPublicDto } from '../../core/services/user.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'mado-settings-profile',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h2 class="section-title">Profile</h2>
    @if (me) {
      <section class="mado-card block">
        <h3>Profile preview</h3>
        <div class="preview">
          <div class="avatar-ph" [style.backgroundImage]="me.avatarUrl ? 'url(' + me.avatarUrl + ')' : null">
            @if (!me.avatarUrl) {
              <span>{{ (me.displayName || me.username).charAt(0).toUpperCase() }}</span>
            }
          </div>
          <div>
            <div class="name">{{ me.displayName || me.username }}</div>
            <p class="muted">{{ me.bio || me.username + "'s channel" }}</p>
          </div>
        </div>
        <p class="hint">Avatar upload is not wired in this build — use API later.</p>
      </section>

      <section class="mado-card block">
        <h3>Display name</h3>
        <input type="text" [(ngModel)]="displayName" maxlength="50" class="inp" />
      </section>

      <section class="mado-card block">
        <h3>Bio</h3>
        <textarea [(ngModel)]="bio" rows="4" maxlength="2000" class="inp ta" placeholder="Tell viewers about your channel"></textarea>
      </section>

      <button type="button" class="btn" [disabled]="saving" (click)="save()">{{ saving ? 'Saving…' : 'Save changes' }}</button>
    }
  `,
  styles: [`
    .section-title { font-size: 1.35rem; margin: 0 0 1rem; color: var(--text-primary); }
    h3 { font-size: 1rem; margin: 0 0 .75rem; color: var(--text-secondary); }
    .block { padding: 1.25rem; margin-bottom: 1rem; }
    .preview {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .avatar-ph {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: var(--bg-tertiary);
      border: 2px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--accent);
      background-size: cover;
      background-position: center;
    }
    .name { font-weight: 800; font-size: 1.1rem; }
    .muted { color: var(--text-secondary); margin: .25rem 0 0; font-size: .9rem; }
    .hint { font-size: .8rem; color: var(--text-muted); margin: .75rem 0 0; }
    .inp {
      width: 100%;
      max-width: 480px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: .55rem .75rem;
      color: var(--text-primary);
      font-family: inherit;
    }
    .ta { resize: vertical; min-height: 100px; max-width: 100%; }
    .btn {
      background: var(--accent);
      color: #000;
      border: none;
      border-radius: 10px;
      font-weight: 800;
      padding: .6rem 1.35rem;
      cursor: pointer;
      font-family: inherit;
    }
    .btn:disabled { opacity: .6; cursor: not-allowed; }
  `]
})
export class SettingsProfileComponent implements OnInit {
  me: UserPublicDto | null = null;
  displayName = '';
  bio = '';
  saving = false;

  constructor(
    private readonly auth: AuthService,
    private readonly users: UserService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const u = this.auth.currentUser$.value;
    if (!u) {
      return;
    }
    this.users.getByUsername(u.username).subscribe({
      next: (r) => {
        this.me = r;
        this.displayName = r.displayName ?? '';
        this.bio = r.bio ?? '';
      },
      error: () => {
        this.me = {
          id: u.id,
          username: u.username,
          email: u.email,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl ?? null,
          bio: null,
          role: u.role,
          isVerified: u.isVerified
        };
        this.displayName = u.displayName ?? '';
        this.bio = '';
      }
    });
  }

  save(): void {
    const u = this.auth.currentUser$.value;
    if (!u) {
      return;
    }
    this.saving = true;
    this.users.patchProfile(u.username, { displayName: this.displayName, bio: this.bio }).subscribe({
      next: (r) => {
        this.me = r;
        this.saving = false;
        this.toastr.success('Profile updated');
        const cur = this.auth.currentUser$.value;
        if (cur && r.displayName !== cur.displayName) {
          this.auth.updateLocalUser({ ...cur, displayName: r.displayName ?? cur.displayName });
        }
      },
      error: () => {
        this.saving = false;
        this.toastr.error('Could not save');
      }
    });
  }
}
