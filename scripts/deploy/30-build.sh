#!/usr/bin/env bash
set -euo pipefail
cd /opt/lazeyka/app

echo '== npm install =='
npm install --no-audit --no-fund

echo '== build (nitro node-server preset) =='
export NITRO_PRESET=node-server
export NODE_OPTIONS=--max-old-space-size=1536
npm run build

echo '== output =='
ls -la .output/server/index.mjs
echo 'BUILD OK'
