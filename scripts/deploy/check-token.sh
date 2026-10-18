#!/usr/bin/env bash
set -euo pipefail
cd /opt/lazeyka/app
T=$(grep -E '^TELEGRAM_BOT_TOKEN=' .env | cut -d= -f2-)
echo "len=${#T}"
echo "head=${T:0:12}"
echo "tail=${T: -6}"
echo "has_CR_or_space:"
printf '%s' "$T" | od -c | tail -3
echo "--- getMe with this exact token via relay-less node path ---"
