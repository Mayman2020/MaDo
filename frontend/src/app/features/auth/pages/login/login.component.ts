import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { authActions } from '../../../../store/auth/auth.actions';

@Component({
  selector: 'mado-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth mado-card">
      <h1 class="mado-heading">Welcome Back</h1>

      @if (error) {
        <div class="error-banner">{{ error }}</div>
      }

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="field">
          <label>Email or Username</label>
          <input formControlName="identifier" type="text" placeholder="you@example.com or username"
                 [class.invalid]="form.controls.identifier.invalid && form.controls.identifier.touched"
                 (input)="error = ''" autocomplete="username" />
          @if (form.controls.identifier.touched && form.controls.identifier.errors?.['required']) {
            <span class="hint">Email or username is required</span>
          }
        </div>

        <div class="field">
          <label>Password</label>
          <input formControlName="password" type="password" placeholder="••••••••"
                 [class.invalid]="form.controls.password.invalid && form.controls.password.touched"
                 (input)="error = ''" />
          @if (form.controls.password.touched && form.controls.password.errors?.['required']) {
            <span class="hint">Password is required</span>
          }
        </div>

        @if (totpRequired) {
          <div class="field">
            <label>Authenticator code</label>
            <input formControlName="totpCode" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="8"
                   autocomplete="one-time-code" placeholder="6-digit code"
                   (input)="error = ''" />
            <span class="hint subtle">Enter the code from your authenticator app.</span>
          </div>
        }

        <div class="remember-row">
          <label class="remember">
            <input type="checkbox" formControlName="rememberMe" /> Remember me
          </label>
          <a routerLink="/forgot-password" class="forgot">Forgot password?</a>
        </div>

        <button type="submit" [disabled]="form.invalid || loading">
          @if (loading) { Logging in… } @else { Login }
        </button>
      </form>

      <p>New to MaDo? <a routerLink="/register">Create account</a></p>
    </section>
  `,
  styles: [`
    .auth {
      max-width: 420px;
      margin: 3rem auto;
      padding: 2rem;
      display: grid;
      gap: 1.25rem;
    }
    .error-banner {
      background: rgba(255,65,65,.15);
      border: 1px solid var(--danger);
      border-radius: 8px;
      color: var(--danger);
      padding: .65rem 1rem;
      font-size: .9rem;
    }
    form { display: grid; gap: .9rem; }
    .field { display: grid; gap: .3rem; }
    label { color: var(--text-secondary); font-size: .85rem; }
    input[type=email], input[type=password], input[type=text] {
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: .75rem;
      color: var(--text-primary);
      font-size: 1rem;
      outline: none;
      transition: border-color .15s;
    }
    input[type=email]:focus, input[type=password]:focus, input[type=text]:focus {
      border-color: var(--accent);
    }
    input.invalid { border-color: var(--danger); }
    .hint { color: var(--danger); font-size: .78rem; }
    .hint.subtle { color: var(--text-muted); }
    .remember-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: .85rem;
    }
    .remember {
      display: flex;
      align-items: center;
      gap: .4rem;
      color: var(--text-secondary);
      cursor: pointer;
    }
    .forgot { color: var(--accent); text-decoration: none; }
    button {
      margin-top: .25rem;
      border: 0;
      border-radius: 10px;
      background: var(--accent);
      color: #000;
      font-weight: 700;
      padding: .75rem;
      cursor: pointer;
      font-size: 1rem;
      transition: filter .15s;
    }
    button:hover:not(:disabled) { filter: brightness(1.1); }
    button:disabled { opacity: .6; cursor: default; }
    p { color: var(--text-secondary); margin: 0; text-align: center; }
    a { color: var(--accent); text-decoration: none; }
  `]
})
export class LoginComponent {
  loading = false;
  error = '';
  totpRequired = false;

  readonly form = this.fb.nonNullable.group({
    identifier: ['', [Validators.required]],
    password: ['', [Validators.required]],
    totpCode: [''],
    rememberMe: [false]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly store: Store
  ) {}

  submit(): void {
    if (this.form.invalid || this.loading) return;
    if (this.totpRequired && !this.form.value.totpCode?.trim()) {
      this.error = 'Enter your 6-digit authenticator code.';
      return;
    }
    this.error = '';
    this.loading = true;
    this.store.dispatch(authActions.loginStart());
    const totp = this.totpRequired ? this.form.value.totpCode : undefined;
    this.authService.login(this.form.value.identifier!, this.form.value.password!, totp).subscribe({
      next: (res) => {
        this.store.dispatch(authActions.authSuccess({ user: res.user, accessToken: res.accessToken }));
        this.router.navigateByUrl('/');
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Login failed. Please check your credentials.';
        if (msg === 'TOTP_REQUIRED') {
          this.totpRequired = true;
          this.error = 'This account uses 2FA. Enter your authenticator code below.';
        } else {
          this.error = msg;
        }
        this.store.dispatch(authActions.authFailure({ error: this.error }));
        this.loading = false;
      },
      complete: () => { this.loading = false; }
    });
  }
}
