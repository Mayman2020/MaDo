# MaDo — Live Streaming Platform

A full-featured live streaming platform built with Spring Boot 3, Angular 17, PostgreSQL, Redis, and nginx-rtmp.

---

## Stack Overview

| Layer | Technology |
|---|---|
| API | Spring Boot 3.3.5 · Java 17 · JWT |
| Frontend | Angular 17 · NgRx · Tailwind CSS |
| Streaming | nginx-rtmp + FFmpeg (HLS adaptive bitrate) |
| Database | PostgreSQL 16 · Flyway migrations |
| Cache | Redis 7 |
| Object Storage | MinIO (S3-compatible) |
| Payments | Stripe |
| Monitoring | Spring Actuator → Prometheus → Grafana |
| Error Tracking | Sentry (backend + frontend) |

---

## Local Development

### Prerequisites

- Docker Desktop 24+
- Java 17 (for IDE support only; builds run in Docker)
- Node 20 (optional, for frontend without Docker)

### Quick Start

```bash
# 1. Copy env template (dev defaults already work)
cp .env.example .env

# 2. Start all services
docker compose up -d

# 3. Open
#   Frontend:  http://localhost:4200
#   API:       http://localhost:8080
#   MinIO UI:  http://localhost:9001  (minioadmin / minioadmin)
#   RTMP:      rtmp://localhost:1935/live/<stream-key>
#   HLS:       http://localhost:8088/hls/<stream-key>/index.m3u8
```

### Stream from OBS

1. Settings → Stream → Custom
2. Server: `rtmp://localhost:1935/live`
3. Stream Key: your key from the dashboard

---

## Production Deployment

### Prerequisites on the server

```bash
# Docker Engine + Compose plugin
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

Port requirements:

| Port | Purpose |
|---|---|
| 80 | HTTP / Let's Encrypt ACME challenge |
| 443 | HTTPS |
| 1935 | RTMP ingest (OBS / streaming software) |

### 1. Configure Environment

```bash
cp .env.example .env
nano .env  # fill in every value — see comments in file
```

Generate secrets:
```bash
openssl rand -hex 64  # JWT_SECRET
openssl rand -hex 32  # STREAM_CALLBACK_SECRET
openssl rand -hex 24  # POSTGRES_PASSWORD, REDIS_PASSWORD, MINIO_ROOT_PASSWORD
```

### 2. Obtain SSL Certificate (first time only)

```bash
chmod +x deploy.sh
./deploy.sh ssl
```

This runs Certbot via Docker, writes certificates to the `certbot_certs` named volume, and configures auto-renewal every 12 hours inside the `certbot` container.

### 3. Deploy

```bash
./deploy.sh deploy
```

Builds all Docker images, starts every service, and verifies the backend health endpoint.

### 4. Verify

```bash
./deploy.sh status          # container status
./deploy.sh logs backend    # Spring Boot logs
curl https://your-domain.com/actuator/health
```

### Subsequent Deploys

```bash
git pull
./deploy.sh deploy
```

### Deploy Script Reference

```
./deploy.sh check       — validate prerequisites and .env
./deploy.sh ssl         — obtain Let's Encrypt certificate (run once)
./deploy.sh build       — build images only
./deploy.sh deploy      — full build + deploy
./deploy.sh monitoring  — start Prometheus + Grafana
./deploy.sh rollback    — stop all containers
./deploy.sh logs [svc]  — tail logs (default: backend)
./deploy.sh status      — show container status
```

---

## HTTPS / nginx Reverse Proxy

`nginx/nginx-proxy.conf` is a template processed by `envsubst` at startup; `$DOMAIN` is substituted from the `DOMAIN` env var.

| Path | Destination |
|---|---|
| `/` | Angular frontend container |
| `/api/` | Spring Boot backend :8080 |
| `/ws` | Spring Boot WebSocket (STOMP/SockJS) |
| `/hls/` | nginx-rtmp HLS segments :8088 |
| `/actuator/health` | Spring Boot health (public) |

---

## Production Monitoring

### Start the Monitoring Stack

```bash
./deploy.sh monitoring
```

| Service | URL | Purpose |
|---|---|---|
| Prometheus | `http://prometheus:9090` | Metrics scraping |
| Alertmanager | `http://alertmanager:9093` | Alert routing + email |
| Grafana | `http://grafana:3000` | Dashboards |

### Metrics Endpoint

```
GET /actuator/prometheus    (requires ADMIN role in production)
```

### Alert Rules (`monitoring/alert.rules.yml`)

| Alert | Condition |
|---|---|
| `BackendDown` | Prometheus can't scrape backend for 2 min |
| `RedisDown` | Redis connectivity lost |
| `HighErrorRate` | > 5% of requests return 5xx |
| `PaymentFailures` | > 5 payment failures in 10 min |
| `StreamPublishErrors` | > 3 stream errors in 10 min |
| `HighHeapUsage` | JVM heap > 90% |
| `SlowApiRequests` | p95 latency > 2 s |

Email alerts go via Gmail SMTP. Set `MAIL_USERNAME` / `MAIL_PASSWORD` in `.env` and update `to:` in `monitoring/alertmanager.yml`.

### Sentry

- Backend: set `SENTRY_BACKEND_DSN` in `.env`. Reports all uncaught exceptions + 10% of traces.
- Frontend: set `SENTRY_FRONTEND_DSN` as a build arg in `docker-compose.prod.yml`.

### Logs

Logs written to `/var/log/mado/` inside the backend container (`SPRING_PROFILES_ACTIVE=prod`):

| File | Content | Retention |
|---|---|---|
| `app.log` | All levels, daily rotation | 30 days |
| `error.log` | ERROR only | 90 days |

---

## Database

- Engine: PostgreSQL 16, schema `kick_live`
- Migrations: Flyway (`backend/src/main/resources/db/migration/`)

### Backup

```bash
docker exec $(docker ps -qf name=postgres) \
  pg_dump -U mado madodb > backup-$(date +%Y%m%d).sql
```

### Restore

```bash
cat backup.sql | docker exec -i $(docker ps -qf name=postgres) \
  psql -U mado madodb
```

---

## Running Tests

```bash
cd backend
./mvnw test
```

| Test File | Covers |
|---|---|
| `AuthServiceTest` | Register / login / 2FA / change-password logic |
| `AuthControllerTest` | Auth endpoints + rate-limiter HTTP responses |
| `StreamKeySecurityTest` | Callback secret guard (wrong secret → 403) |
| `ChatRateLimiterTest` | 1 msg/sec per user per channel (Redis SET NX) |
| `AdminAuthorizationTest` | Privileged endpoints reject missing/bad secrets |
| `SubscriptionControllerTest` | Payment flow endpoint contracts |
| `CategoryControllerStandaloneTest` | Category pagination |

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DOMAIN` | Yes | Production domain (e.g. `mado.live`) |
| `LETSENCRYPT_EMAIL` | Yes | Email for cert expiry notices |
| `JWT_SECRET` | Yes | HS512 signing key, min 64 hex chars |
| `POSTGRES_PASSWORD` | Yes | PostgreSQL password |
| `REDIS_PASSWORD` | Yes | Redis AUTH password |
| `MINIO_ROOT_PASSWORD` | Yes | MinIO root password |
| `STRIPE_SECRET_KEY` | Yes | Stripe live/test secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `MAIL_USERNAME` | Yes | Gmail address for transactional email |
| `MAIL_PASSWORD` | Yes | Gmail App Password |
| `STREAM_CALLBACK_SECRET` | Yes | Shared secret for nginx-rtmp callbacks |
| `SENTRY_BACKEND_DSN` | No | Sentry DSN for backend error tracking |
| `SENTRY_FRONTEND_DSN` | No | Sentry DSN for frontend error tracking |
| `GRAFANA_PASSWORD` | No | Grafana admin password (default: changeme) |

---

## Architecture

```
Internet
   │
   ├─ :443 HTTPS ──→ nginx-proxy ──┬─ /      → Angular (frontend)
   │                               ├─ /api/  → Spring Boot (backend)
   │                               ├─ /ws    → Spring Boot (WebSocket)
   │                               └─ /hls/  → nginx-rtmp (HLS)
   │
   └─ :1935 RTMP ──→ nginx-rtmp ──→ FFmpeg transcode ──→ /var/hls/

Backend internal:
  backend → postgres:5432
  backend → redis:6379
  backend → minio:9000
  backend → smtp.gmail.com:587
  backend → api.stripe.com (HTTPS)
```
