import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const u = auth.currentUser$.getValue();
  if (auth.getAccessToken() && u?.role === 'ADMIN') {
    return true;
  }
  return router.parseUrl('/');
};
