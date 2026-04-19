import { environment } from './environment';

/** Spring Boot in dev (avoid `localhost` → IPv6 issues on some Windows setups). */
export const DEV_API_ORIGIN = 'http://127.0.0.1:8090';

/**
 * HTTP/WebSocket base for the Spring API. Not file-replaced (import this from interceptors).
 * - Production: same-origin `/api` (nginx, etc.).
 * - Dev on ng serve (4200/4300): same-origin so `proxy.conf.json` forwards to 8090.
 * - Dev on other ports (e.g. embedded preview): direct API origin.
 */
export function resolveApiBaseUrl(): string {
  if (environment.production) {
    return environment.apiBaseUrl ?? '';
  }
  if (typeof window === 'undefined') {
    return DEV_API_ORIGIN;
  }
  const { hostname, port } = window.location;
  const local = hostname === 'localhost' || hostname === '127.0.0.1';
  if (local && (port === '4200' || port === '4300')) {
    return '';
  }
  return DEV_API_ORIGIN;
}
