/**
 * Production: same-origin `/api` (reverse proxy) or relative URLs.
 */
export const environment = {
  production: true,
  apiBaseUrl: '',
  rtmpIngestUrl: 'rtmp://127.0.0.1:1935/live',
  stripePublishableKey: 'pk_live_REPLACE_WITH_YOUR_STRIPE_PUBLISHABLE_KEY'
};
