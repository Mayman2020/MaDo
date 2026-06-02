import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'mado-settings-security',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h2 class="section-title">Security</h2>
    <section class="mado-card block">
      <h3>Change Password</h3>
      @if (pwSuccess) {
        <div class="success-banner">Password changed successfully!</div>
      }
      @if (pwError) {
        <div class="error-banner">{{ pwError }}</div>
      }
      <div class="form">
        <label class="lbl">Current password</label>
        <input type="password" class="inp" [(ngModel)]="currentPw" autocomplete="current-password" />
        <label class="lbl">New password</label>
        <input type="password" class="inp" [(ngModel)]="newPw" autocomplete="new-password" />
        <label class="lbl">Confirm new password</label>
        <input type="password" class="inp" [(ngModel)]="confirmPw" autocomplete="new-password" />
        <button type="button" class="btn" [disabled]="saving || !currentPw || !newPw || newPw !== confirmPw || newPw.length < 8" (click)="changePassword()">
          {{ saving ? 'Saving…' : 'Change Password' }}
        </button>
        @if (newPw && newPw.length < 8) {
          <p class="hint">Password must be at least 8 characters.</p>
        }
        @if (newPw && confirmPw && newPw !== confirmPw) {
          <p class="hint err">Passwords do not match.</p>
        }
      </div>
    </section>

    <section class="mado-card block">
      <h3>Two-factor authentication (TOTP)</h3>
      @if (twoFaLoading) {
        <p class="muted">Loading…</p>
      } @else if (twoFaEnabled) {
        <p class="muted">2FA is enabled. To turn it off, confirm your password and a valid code.</p>
        <div class="form">
          <label class="lbl">Password</label>
          <input type="password" class="inp" [(ngModel)]="disablePw" autocomplete="current-password" />
          <label class="lbl">6-digit code</label>
          <input class="inp" [(ngModel)]="disableCode" inputmode="numeric" maxlength="8" autocomplete="one-time-code" />
          <button type="button" class="btn danger" [disabled]="disabling" (click)="disableTwoFa()">
            {{ disabling ? 'Working…' : 'Disable 2FA' }}
          </button>
        </div>
      } @else if (!setupOtpauthUrl) {
        <p class="muted">Use an authenticator app (Google Authenticator, Authy, etc.). Enter your password to generate a setup key.</p>
        <div class="form">
          <label class="lbl">Password</label>
          <input type="password" class="inp" [(ngModel)]="beginPw" autocomplete="current-password" />
          <button type="button" class="btn" [disabled]="beginning" (click)="beginTwoFa()">
            {{ beginning ? 'Please wait…' : 'Start setup' }}
          </button>
        </div>
      } @else {
        <p class="muted">Scan this QR code with your authenticator app, then enter a 6-digit code to confirm.</p>
        <div class="qr-wrap">
          <img [src]="qrDataUrl" width="200" height="200" alt="2FA QR code" />
        </div>
        <p class="mono small">Manual key: {{ setupSecret }}</p>
        <div class="form">
          <label class="lbl">6-digit code</label>
          <input class="inp" [(ngModel)]="confirmCode" inputmode="numeric" maxlength="8" autocomplete="one-time-code" />
          <button type="button" class="btn" [disabled]="confirming || !confirmCode.trim()" (click)="confirmTwoFa()">
            {{ confirming ? 'Enabling…' : 'Enable 2FA' }}
          </button>
          <button type="button" class="btn secondary" (click)="cancelSetup()">Cancel</button>
        </div>
      }
    </section>
  `,
  styles: [`
    .section-title { font-size: 1.35rem; margin: 0 0 1rem; color: var(--text-primary); }
    h3 { font-size: 1rem; margin: 0 0 .5rem; color: var(--text-secondary); }
    .block { padding: 1.25rem; margin-bottom: 1rem; }
    .muted { color: var(--text-secondary); font-size: .9rem; margin: 0 0 1rem; line-height: 1.45; }
    .form { display: flex; flex-direction: column; gap: .6rem; max-width: 360px; }
    .lbl { font-size: .82rem; font-weight: 700; color: var(--text-muted); }
    .inp {
      background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 10px;
      padding: .55rem .75rem; color: var(--text-primary); font-family: inherit; outline: none;
    }
    .inp:focus { border-color: var(--accent); }
    .btn {
      background: var(--accent); color: #000; border: none; border-radius: 10px;
      font-weight: 800; padding: .6rem 1.25rem; cursor: pointer; font-family: inherit; margin-top: .25rem;
    }
    .btn.secondary { background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border); }
    .btn.danger { background: transparent; color: var(--danger); border: 1px solid var(--danger); }
    .btn:disabled { opacity: .5; cursor: not-allowed; }
    .hint { font-size: .8rem; color: var(--text-muted); margin: 0; }
    .hint.err { color: #f44336; }
    .success-banner { background: rgba(83,252,24,.1); color: var(--accent); padding: .6rem .75rem; border-radius: 8px; margin-bottom: .75rem; }
    .error-banner { background: rgba(244,67,54,.1); color: #f44336; padding: .6rem .75rem; border-radius: 8px; margin-bottom: .75rem; }
    .qr-wrap { margin: 1rem 0; padding: .75rem; background: #fff; border-radius: 12px; display: inline-block; }
    .mono { font-family: "JetBrains Mono", monospace; word-break: break-all; }
    .small { font-size: .78rem; color: var(--text-muted); }
  `]
})
export class SettingsSecurityComponent implements OnInit {
  currentPw = '';
  newPw = '';
  confirmPw = '';
  saving = false;
  pwSuccess = false;
  pwError = '';

  twoFaLoading = true;
  twoFaEnabled = false;
  beginning = false;
  confirming = false;
  disabling = false;
  beginPw = '';
  setupSecret = '';
  setupOtpauthUrl = '';
  confirmCode = '';
  disablePw = '';
  disableCode = '';

  constructor(
    private readonly http: HttpClient,
    private readonly toastr: ToastrService,
    private readonly auth: AuthService
  ) {}

  get qrDataUrl(): string {
    if (!this.setupOtpauthUrl) return '';
    return 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(this.setupOtpauthUrl);
  }

  ngOnInit(): void {
    this.reloadTwoFaStatus();
  }

  reloadTwoFaStatus(): void {
    this.twoFaLoading = true;
    this.http.get<{ enabled: boolean }>('/api/auth/2fa/status').subscribe({
      next: (s) => {
        this.twoFaEnabled = !!s.enabled;
        this.twoFaLoading = false;
      },
      error: () => {
        this.twoFaLoading = false;
      }
    });
  }

  changePassword(): void {
    if (this.newPw !== this.confirmPw || this.newPw.length < 8) return;
    this.saving = true;
    this.pwError = '';
    this.pwSuccess = false;
    this.http.post('/api/auth/change-password', { currentPassword: this.currentPw, newPassword: this.newPw }).subscribe({
      next: () => {
        this.saving = false;
        this.pwSuccess = true;
        this.currentPw = '';
        this.newPw = '';
        this.confirmPw = '';
        this.toastr.success('Password changed!');
      },
      error: (err) => {
        this.saving = false;
        this.pwError = err?.error?.message ?? 'Failed to change password.';
      }
    });
  }

  beginTwoFa(): void {
    if (!this.beginPw) {
      this.toastr.warning('Enter your password');
      return;
    }
    this.beginning = true;
    this.http.post<{ secret: string; otpauthUrl: string }>('/api/auth/2fa/begin', { password: this.beginPw }).subscribe({
      next: (r) => {
        this.setupSecret = r.secret;
        this.setupOtpauthUrl = r.otpauthUrl;
        this.beginPw = '';
        this.beginning = false;
      },
      error: (err) => {
        this.beginning = false;
        this.toastr.error(err?.error?.message ?? 'Could not start 2FA setup');
      }
    });
  }

  confirmTwoFa(): void {
    if (!this.confirmCode.trim()) return;
    this.confirming = true;
    this.http.post('/api/auth/2fa/confirm', { code: this.confirmCode.trim() }).subscribe({
      next: () => {
        this.confirming = false;
        this.setupOtpauthUrl = '';
        this.setupSecret = '';
        this.confirmCode = '';
        this.twoFaEnabled = true;
        const u = this.auth.currentUser$.value;
        if (u) {
          this.auth.updateLocalUser({ ...u, twoFaEnabled: true });
        }
        this.toastr.success('2FA enabled');
        this.reloadTwoFaStatus();
      },
      error: (err) => {
        this.confirming = false;
        this.toastr.error(err?.error?.message ?? 'Invalid code');
      }
    });
  }

  cancelSetup(): void {
    this.setupOtpauthUrl = '';
    this.setupSecret = '';
    this.confirmCode = '';
  }

  disableTwoFa(): void {
    if (!this.disablePw || !this.disableCode.trim()) {
      this.toastr.warning('Password and code required');
      return;
    }
    this.disabling = true;
    this.http.post('/api/auth/2fa/disable', { password: this.disablePw, code: this.disableCode.trim() }).subscribe({
      next: () => {
        this.disabling = false;
        this.disablePw = '';
        this.disableCode = '';
        this.twoFaEnabled = false;
        const u = this.auth.currentUser$.value;
        if (u) {
          this.auth.updateLocalUser({ ...u, twoFaEnabled: false });
        }
        this.toastr.success('2FA disabled');
        this.reloadTwoFaStatus();
      },
      error: (err) => {
        this.disabling = false;
        this.toastr.error(err?.error?.message ?? 'Could not disable 2FA');
      }
    });
  }
}
