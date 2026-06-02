#!/usr/bin/env bash
# ============================================================
# MaDo Platform — Production Deployment Script
# Usage: ./deploy.sh {check|ssl|build|deploy|monitoring|rollback|logs [svc]|status}
# ============================================================
set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
COMPOSE="docker compose -f ${COMPOSE_FILE}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }
step()  { echo -e "\n${BLUE}==> $*${NC}"; }

# ── Prerequisite check ───────────────────────────────────────
check_deps() {
    step "Checking prerequisites"
    command -v docker >/dev/null 2>&1 || error "docker is not installed"
    command -v curl   >/dev/null 2>&1 || error "curl is not installed"
    docker compose version >/dev/null 2>&1 || error "docker compose v2 plugin not found"
    info "Prerequisites OK"
}

# ── .env validation ──────────────────────────────────────────
check_env() {
    step "Validating environment"
    [[ -f .env ]] || error ".env not found — copy .env.example → .env and fill in all secrets"

    local required=(
        DOMAIN LETSENCRYPT_EMAIL
        JWT_SECRET
        POSTGRES_PASSWORD REDIS_PASSWORD MINIO_ROOT_PASSWORD
        STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET
        MAIL_USERNAME MAIL_PASSWORD
        STREAM_CALLBACK_SECRET
    )
    local missing=()
    for var in "${required[@]}"; do
        local val
        val=$(grep -E "^${var}=" .env 2>/dev/null | cut -d'=' -f2- || true)
        [[ -n "${val:-}" ]] || missing+=("$var")
    done
    if [[ ${#missing[@]} -gt 0 ]]; then
        error "Missing required .env variables: ${missing[*]}"
    fi
    info "Environment OK"
}

# ── One-time SSL certificate via Let's Encrypt ───────────────
init_ssl() {
    step "Obtaining SSL certificate (run once on first deploy)"
    # shellcheck disable=SC1091
    source .env

    # Temporarily start nginx-proxy to serve the ACME challenge over port 80
    $COMPOSE up -d nginx-proxy
    sleep 5

    docker run --rm \
        -v "$(docker volume inspect --format '{{.Mountpoint}}' "$(basename "$PWD")_certbot_webroot" 2>/dev/null || echo certbot_webroot)":/var/www/certbot \
        -v "$(docker volume inspect --format '{{.Mountpoint}}' "$(basename "$PWD")_certbot_certs" 2>/dev/null || echo certbot_certs)":/etc/letsencrypt \
        certbot/certbot certonly \
        --webroot --webroot-path /var/www/certbot \
        -d "${DOMAIN}" -d "www.${DOMAIN}" \
        --email "${LETSENCRYPT_EMAIL}" \
        --agree-tos --non-interactive --no-eff-email \
        || error "certbot failed — ensure port 80 is open and DNS points to this server"

    info "SSL certificate obtained for ${DOMAIN}"
}

# ── Build Docker images ──────────────────────────────────────
build() {
    step "Building Docker images"
    $COMPOSE build --no-cache
    info "Build complete"
}

# ── Deploy all services ──────────────────────────────────────
deploy() {
    step "Starting services"
    $COMPOSE up -d --remove-orphans

    step "Waiting for backend health (up to 120 s)"
    local n=0
    until curl -sf "http://localhost:8080/actuator/health" 2>/dev/null | grep -q '"status":"UP"' \
          || [[ $n -ge 24 ]]; do
        sleep 5; n=$((n + 1)); printf "."
    done
    echo ""

    if curl -sf "http://localhost:8080/actuator/health" 2>/dev/null | grep -q '"status":"UP"'; then
        info "Backend is healthy ✓"
    else
        warn "Backend health check failed — inspect logs with: $0 logs backend"
    fi
    info "Deployment complete — https://$(grep '^DOMAIN=' .env | cut -d'=' -f2)"
}

# ── Start monitoring stack ───────────────────────────────────
deploy_monitoring() {
    step "Starting monitoring stack (Prometheus + Alertmanager + Grafana)"
    $COMPOSE --profile monitoring up -d prometheus alertmanager grafana
    info "Monitoring stack started"
    info "Grafana: http://localhost:3000  (set GF_SERVER_ROOT_URL for production)"
}

# ── Stop everything ──────────────────────────────────────────
rollback() {
    step "Stopping all containers"
    $COMPOSE down
    warn "All containers stopped. To restore, re-run: $0 deploy"
}

# ── Helpers ──────────────────────────────────────────────────
logs()   { $COMPOSE logs -f "${2:-backend}"; }
status() { $COMPOSE ps; }

# ── Entry point ──────────────────────────────────────────────
case "${1:-help}" in
    check)       check_deps && check_env ;;
    ssl)         check_deps && check_env && init_ssl ;;
    build)       check_deps && check_env && build ;;
    deploy)      check_deps && check_env && build && deploy ;;
    monitoring)  check_deps && check_env && deploy_monitoring ;;
    rollback)    rollback ;;
    logs)        logs "$@" ;;
    status)      status ;;
    help|*)
        cat <<'EOF'
Usage: ./deploy.sh <command>

  check       Validate prerequisites and .env file
  ssl         Obtain Let's Encrypt certificate (run once before first deploy)
  build       Build Docker images (no deploy)
  deploy      Full build + deploy (recommended for production)
  monitoring  Start Prometheus + Alertmanager + Grafana
  rollback    Stop all running containers
  logs [svc]  Tail container logs (default: backend)
  status      Show container status

First-time setup order:
  1. cp .env.example .env && vim .env
  2. ./deploy.sh check
  3. ./deploy.sh ssl
  4. ./deploy.sh deploy
  5. ./deploy.sh monitoring   # optional
EOF
        ;;
esac
