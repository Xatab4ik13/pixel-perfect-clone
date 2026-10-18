#!/usr/bin/env bash
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

echo '== DNS check =='
getent hosts lazeyka.hhr.pro || echo '(no A record yet)'

echo '== swap (2G) =='
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
free -m | head -3

echo '== apt update =='
apt-get update -y

echo '== base packages =='
apt-get install -y ca-certificates curl gnupg lsb-release ufw ntpsec-ntpdate 

echo '== Node.js 24 via NodeSource =='
if ! command -v node >/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
  apt-get install -y nodejs
fi
node -v && npm -v

echo '== PostgreSQL =='
apt-get install -y postgresql postgresql-contrib
systemctl enable --now postgresql
sudo -u postgres psql -tAc 'select version();' | head -1

echo '== Nginx =='
apt-get install -y nginx
systemctl enable --now nginx

echo '== certbot =='
apt-get install -y certbot python3-certbot-nginx

echo '== done =='
echo "node=$(node -v) npm=$(npm -v) pg=$(sudo -u postgres psql -tAc 'show server_version;' 2>/dev/null)"
