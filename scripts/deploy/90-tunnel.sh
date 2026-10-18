#!/usr/bin/env bash
set -euo pipefail

# Pre-trust the node host key for the tunnel's known_hosts.
ssh-keyscan -t ed25519 72.56.76.88 > /root/.ssh/known_hosts_telemt 2>/dev/null || true

cat > /etc/systemd/system/telemt-tunnel.service <<'EOF'
[Unit]
Description=SSH tunnel to telemt control API (node 127.0.0.1:9091)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/bin/ssh -NT \
  -i /root/.ssh/telemt_tunnel \
  -o ExitOnForwardFailure=yes \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=3 \
  -o StrictHostKeyChecking=accept-new \
  -o UserKnownHostsFile=/root/.ssh/known_hosts_telemt \
  -L 127.0.0.1:9091:127.0.0.1:9091 \
  root@72.56.76.88
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable telemt-tunnel
systemctl restart telemt-tunnel
sleep 3
echo -n 'tunnel: '; systemctl is-active telemt-tunnel
echo '== probe node API via tunnel =='
curl -s -o /dev/null -w 'active-ips -> HTTP %{http_code}\n' http://127.0.0.1:9091/v1/stats/users/active-ips
