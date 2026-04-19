import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { catchError, throwError } from 'rxjs';

/** Avoid double toasts with login/register handlers and refresh noise. */
function skipGlobalToast(reqUrl: string, err: HttpErrorResponse): boolean {
  if (reqUrl.includes('/api/auth/login') || reqUrl.includes('/api/auth/register')) {
    return true;
  }
  if (reqUrl.includes('/api/auth/refresh')) {
    return true;
  }
  if (reqUrl.includes('/api/auth/logout')) {
    return true;
  }
  if (err.status === 0) {
    return false;
  }
  return false;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!skipGlobalToast(req.url, error)) {
        const message =
          error.status === 0
            ? 'Cannot reach server. Is the API running (e.g. http://127.0.0.1:8090)?'
            : error.error?.message || error.message || 'Unexpected error';
        toastr.error(message, 'Request failed');
      }
      return throwError(() => error);
    })
  );
};
