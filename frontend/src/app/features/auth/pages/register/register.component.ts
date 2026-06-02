import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { Store } from '@ngrx/store';
import { authActions } from '../../../../store/auth/auth.actions';

@Component({
  selector: 'mado-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth mado-card">
      <h1 class="mado-heading">Create Your MaDo Account</h1>

      @if (error) {
        <div class="error-banner">{{ error }}</div>
      }

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="field">
          <label>Username</label>
          <input formControlName="username" type="text" placeholder="coolstreamer"
                 [class.invalid]="form.controls.username.invalid && form.controls.username.touched"
                 (input)="error = ''" />
          @if (form.controls.username.touched) {
            @if (form.controls.username.errors?.['minlength']) {
              <span class="hint">At least 3 characters required</span>
            }
            @if (form.controls.username.errors?.['pattern']) {
              <span class="hint">Only letters, numbers and underscores allowed</span>
            }
          }
        </div>

        <div class="field">
          <label>Display Name <span class="optional">(optional)</span></label>
          <input formControlName="displayName" type="text" placeholder="Cool Streamer" />
        </div>

        <div class="field">
          <label>Email</label>
          <input formControlName="email" type="email" placeholder="you@example.com"
                 [class.invalid]="form.controls.email.invalid && form.controls.email.touched"
                 (input)="error = ''" />
          @if (form.controls.email.touched && form.controls.email.errors?.['email']) {
            <span class="hint">Enter a valid email address</span>
          }
        </div>

        <div class="field">
          <label>Password</label>
          <input formControlName="password" type="password" placeholder="Min. 8 characters"
                 [class.invalid]="form.controls.password.invalid && form.controls.password.touched"
                 (input)="error = ''" />
          @if (form.controls.password.touched && form.controls.password.errors?.['minlength']) {
            <span class="hint">Password must be at least 8 characters</span>
          }
        </div>

        <button type="submit" [disabled]="form.invalid || loading">
          @if (loading) { Creating account… } @else { Create Account }
        </button>
      </form>

      <p>Already have an account? <a routerLink="/login">Login</a></p>
    </section>
  `,
  styles: [`
    .auth {
      max-width: 480px;
      margin: 2rem auto;
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
    .optional { color: var(--text-muted); font-size: .8rem; }
    input[type=text], input[type=email], input[type=password] {
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: .75rem;
      color: var(--text-primary);
      font-size: 1rem;
      outline: none;
      transition: border-color .15s;
    }
    input[type=text]:focus, input[type=email]:focus, input[type=password]:focus {
      border-color: var(--accent);
    }
    input.invalid { border-color: var(--danger); }
    .hint { color: var(--danger); font-size: .78rem; }
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
export class RegisterComponent {
  loading = false;
  error = '';

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
    displayName: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly store: Store
  ) {}

  submit(): void {
    if (this.form.invalid || this.loading) return;
    this.error = '';
    this.loading = true;
    this.store.dispatch(authActions.loginStart());
    this.authService.register(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.store.dispatch(authActions.authSuccess({ user: res.user, accessToken: res.accessToken }));
        this.router.navigateByUrl('/');
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'Registration failed. Please try again.';
        this.store.dispatch(authActions.authFailure({ error: this.error }));
        this.loading = false;
      },
      complete: () => { this.loading = false; }
    });
  }
}
