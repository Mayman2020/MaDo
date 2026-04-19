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
      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>Email</label>
        <input formControlName="email" type="email" />
        <label>Password</label>
        <input formControlName="password" type="password" />
        <button type="submit" [disabled]="form.invalid || loading">Login</button>
      </form>
      <p>New to MaDo? <a routerLink="/register">Create account</a></p>
    </section>
  `,
  styles: [`
    .auth {
      max-width: 420px;
      margin: 3rem auto;
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
export class LoginComponent {
  loading = false;
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
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
    this.authService.login(this.form.value.email!, this.form.value.password!).subscribe({
      next: (res) => {
        this.store.dispatch(authActions.authSuccess({ user: res.user, accessToken: res.accessToken }));
        this.router.navigateByUrl('/');
      },
      error: (err) => {
        this.store.dispatch(authActions.authFailure({ error: err?.error?.message ?? 'Login failed' }));
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
