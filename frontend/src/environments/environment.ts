/**
 * Local dev: same pattern as srs-project — call relative `/api/...` and `/ws/...`;
 * `proxy.conf.json` forwards to Spring Boot (default local port 8081 in backend `application-local.yml`).
 */
export const environment = {
  production: false,
  apiBaseUrl: '',
  /** SRS / nginx-rtmp style ingest — adjust to your media server. */
  rtmpIngestUrl: 'rtmp://127.0.0.1:1935/live'
};

