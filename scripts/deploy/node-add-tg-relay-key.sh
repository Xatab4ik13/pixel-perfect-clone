#!/usr/bin/env bash
set -euo pipefail

PUB='ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPqQ1CNhYbg7ut0dvQyq/Rphg/IIxiSMNe4YyWMAvRuy tg-relay@lazeyka'
KEYPART='AAAAC3NzaC1lZDI1NTE5AAAAIPqQ1CNhYbg7ut0dvQyq/Rphg/IIxiSMNe4YyWMAvRuy'
LINE="restrict,port-forwarding,permitopen=\"api.telegram.org:443\" ${PUB}"

mkdir -p /root/.ssh
touch /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys

if grep -qF "$KEYPART" /root/.ssh/authorized_keys; then
  echo "relay key already present; leaving as-is"
else
  cp /root/.ssh/authorized_keys /root/.ssh/authorized_keys.bak.$(date +%s)
  printf '%s\n' "$LINE" >> /root/.ssh/authorized_keys
  echo "relay key appended"
fi

echo "--- authorized_keys entries (comments only) ---"
awk '{ print $NF }' /root/.ssh/authorized_keys
echo "--- total lines ---"
wc -l < /root/.ssh/authorized_keys
