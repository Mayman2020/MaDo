import { HttpInterceptorFn } from '@angular/common/http';
import { resolveApiBaseUrl } from '../../../environments/api-url';

/** Prepends absolute API base when set; empty base keeps `/api` same-origin (ng serve proxy). */
export const apiBaseInterceptor: HttpInterceptorFn = (req, next) => {
  const base = resolveApiBaseUrl().replace(/\/$/, '');
  if (base && req.url.startsWith('/api')) {
    return next(req.clone({ url: base + req.url }));
  }
  return next(req);
};
