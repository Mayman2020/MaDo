# MaDo Platform

MaDo is a live-streaming platform foundation built with:
- Angular 17 + NgRx + Tailwind + Angular Material
- Spring Boot 3.2 + Java 21 + JWT + Liquibase + PostgreSQL + Redis
- nginx-rtmp + FFmpeg multi-quality HLS
- Docker Compose (frontend, backend, postgres, redis, minio, nginx-rtmp)

## Phase 1 Included
- Docker Compose orchestration and service Dockerfiles
- nginx-rtmp config with 1080p/720p/480p/360p HLS renditions
- Spring Boot backend bootstrap + security filter chain + JWT access/refresh flow
- Auth API endpoints:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
  - `POST /api/auth/verify-email` (placeholder)
  - `POST /api/auth/forgot-password` (placeholder)
  - `POST /api/auth/reset-password` (placeholder)
- Liquibase migration with full initial PostgreSQL schema and indexes
- Angular standalone app foundation:
  - routing shell
  - NgRx auth state
  - auth + error interceptors
  - login/register pages

## Quick Start
1. Copy `.env.example` to `.env` and fill secrets.
2. Run:
   ```bash
   docker compose up --build
   ```
3. Frontend: `http://localhost:4200`
4. Backend: `http://localhost:8080`
5. HLS: `http://localhost:8088/hls/{streamKey}/index.m3u8`

## OBS Setup
- Server: `rtmp://YOUR_SERVER_IP:1935/live`
- Stream key: from dashboard (`mado_<uuid4_without_dashes>`)
- Video bitrate: 4500 Kbps (1080p60)
- Audio bitrate: 192 Kbps
