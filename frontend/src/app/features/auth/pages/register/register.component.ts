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
      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>Username</label>
        <input formControlName="username" type="text" />
        <label>Display Name</label>
        <input formControlName="displayName" type="text" />
        <label>Email</label>
        <input formControlName="email" type="email" />
        <label>Password</label>
        <input formControlName="password" type="password" />
        <button type="submit" [disabled]="form.invalid || loading">Register</button>
      </form>
      <p>Already have an account? <a routerLink="/login">Login</a></p>
    </section>
  `,
  styles: [`
    .auth {
      max-width: 480px;
      margin: 2rem auto;
      padding: 1.5rem;
      display: grid;
      gap: 1rem;
    }
    form {
      display: grid;
      gap: .6rem;
    }
    label { color: var(--text-secondary); font-size: .9rem; }
    input {
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: .75rem;
      color: var(--text-primary);
    }
    button {
      margin-top: .4rem;
      border: 0;
      border-radius: 10px;
      background: var(--accent);
      color: #000;
      font-weight: 700;
      padding: .75rem;
      cursor: pointer;
    }
    p { color: var(--text-secondary); margin: 0; }
    a { color: var(--accent); }
  `]
})
export class RegisterComponent {
  loading = false;
  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
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
    this.loading = true;
    this.store.dispatch(authActions.loginStart());
    this.authService.register(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.store.dispatch(authActions.authSuccess({ user: res.user, accessToken: res.accessToken }));
        this.router.navigateByUrl('/');
      },
      error: (err) => {
        this.store.dispatch(authActions.authFailure({ error: err?.error?.message ?? 'Registration failed' }));
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
