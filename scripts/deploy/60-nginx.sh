#!/usr/bin/env bash
set -euo pipefail
DOMAIN=lazeyka.hhr.pro

cat > /etc/nginx/sites-available/lazeyka <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    client_max_body_size 1m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
    }
}
EOF

ln -sf /etc/nginx/sites-available/lazeyka /etc/nginx/sites-enabled/lazeyka
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo '== certbot (TLS) =='
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect

echo '== verify =='
systemctl reload nginx
curl -s -o /dev/null -w 'https / -> HTTP %{http_code}\n' https://$DOMAIN/ || true
curl -s -o /dev/null -w 'https /api/plans -> HTTP %{http_code}\n' https://$DOMAIN/api/plans || true
