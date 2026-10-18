#!/usr/bin/env bash
set +e
echo '== version =='
telemt --version 2>/dev/null || /usr/bin/telemt --version 2>/dev/null
echo
echo '== unit =='
systemctl cat telemt 2>/dev/null | grep -E 'ExecStart|WorkingDirectory|EnvironmentFile'
echo
echo '== find config =='
CFG=$(systemctl cat telemt 2>/dev/null | grep -oE '\-\-config[= ][^ ]+' | sed -E 's/--config[= ]//')
echo "cfg from unit: ${CFG:-<none>}"
for f in "$CFG" /etc/telemt/config.toml /etc/telemt/telemt.toml /etc/telemt.toml /opt/telemt/config.toml /root/telemt.toml; do
  [ -n "$f" ] && [ -f "$f" ] && echo "FOUND: $f"
done
echo
echo '== config (secrets masked) =='
for f in "$CFG" /etc/telemt/config.toml /etc/telemt/telemt.toml /etc/telemt.toml /opt/telemt/config.toml /root/telemt.toml; do
  if [ -n "$f" ] && [ -f "$f" ]; then
    echo "-- $f --"
    sed -E 's/(secret|token|key|password|adtag)([[:space:]]*=[[:space:]]*).*/\1\2***MASKED***/I' "$f"
    break
  fi
done
echo
echo '== API probe on 127.0.0.1:9091 =='
curl -s -o /dev/null -w 'GET /v1/stats/... -> HTTP %{http_code}\n' http://127.0.0.1:9091/v1/stats/users/active-ips
curl -s -o /dev/null -w 'GET / -> HTTP %{http_code}\n' http://127.0.0.1:9091/
