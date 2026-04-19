/**
 * Development defaults. Production builds replace this file with `environment.prod.ts`.
 */
export const environment = {
  production: false,
  /** Unused in dev when `resolveApiBaseUrl()` picks proxy mode; kept for typing parity with prod. */
  apiBaseUrl: 'http://127.0.0.1:8090',
  /** SRS / nginx-rtmp style ingest — adjust to your media server. */
  rtmpIngestUrl: 'rtmp://127.0.0.1:1935/live'
};
