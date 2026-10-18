#!/usr/bin/env bash
set -euo pipefail
ENV_FILE=/opt/lazeyka/app/.env

if [ -f "$ENV_FILE" ]; then
  echo ".env already exists, leaving it untouched"
  exit 0
fi

DB_URL=$(cat /root/lazeyka.dburl)
SESSION_SECRET=$(openssl rand -hex 32)
ADMIN_BOOTSTRAP_TOKEN=$(openssl rand -hex 24)

umask 177
cat > "$ENV_FILE" <<EOF
NODE_ENV=production
PORT=3000

# --- database ---
DATABASE_URL=$DB_URL

# --- app session + public url ---
SESSION_SECRET=$SESSION_SECRET
PUBLIC_BASE_URL=https://lazeyka.hhr.pro

# --- proxy link params (issued to users) ---
PROXY_SERVER_HOST=72.56.76.88
PROXY_SERVER_PORT=443
PROXY_SNI=docs.rs

# --- provisioning backend (telemt control-plane) ---
# STUB mode until the WireGuard tunnel to the node + telemt API are wired.
# In stub mode links are generated locally and are NOT yet live on the proxy.
TELEMT_STUB=1
TELEMT_API_URL=http://127.0.0.1:9091
TELEMT_API_TOKEN=

# --- payments: Raiffeisenbank e-commerce ---
PAYMENT_PROVIDER=raif
PAYMENT_API_URL=https://pay.raif.ru/api
PAYMENT_MERCHANT_ID=138865-1708
# Secret JWT from Raiffeisen cabinet. Set securely (see deploy notes). Rotate the leaked one.
PAYMENT_SECRET=__SET_ME__

# --- Telegram Mini App ---
# Bot token from @BotFather. Set when ready; Mini App auth is disabled until then.
TELEGRAM_BOT_TOKEN=__SET_ME__

# --- admin bootstrap (one-time, to create first admin) ---
ADMIN_BOOTSTRAP_TOKEN=$ADMIN_BOOTSTRAP_TOKEN
EOF
chmod 600 "$ENV_FILE"
echo ".env created at $ENV_FILE"
echo "ADMIN_BOOTSTRAP_TOKEN=$ADMIN_BOOTSTRAP_TOKEN"
