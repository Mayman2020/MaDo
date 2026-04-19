import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const streamerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const u = auth.currentUser$.getValue();
  if (auth.getAccessToken() && u && (u.role === 'STREAMER' || u.role === 'ADMIN' || u.role === 'MODERATOR')) {
    return true;
  }
  return router.parseUrl('/');
};
