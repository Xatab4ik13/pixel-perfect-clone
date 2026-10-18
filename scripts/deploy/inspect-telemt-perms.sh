#!/usr/bin/env bash
set +e
echo '== full unit =='
systemctl cat telemt 2>/dev/null
echo
echo '== process user =='
ps -o pid,user,cmd -p "$(pgrep -x telemt | head -1)" 2>/dev/null
echo
echo '== /etc/telemt perms =='
ls -la /etc/telemt/
echo
echo '== lsattr (immutable?) =='
lsattr /etc/telemt/telemt.toml 2>/dev/null
lsattr -d /etc/telemt 2>/dev/null
echo
echo '== filesystem mount =='
findmnt -no SOURCE,FSTYPE,OPTIONS --target /etc/telemt 2>/dev/null
echo
echo '== any separate users file referenced? =='
grep -iE 'users_file|state|persist|data_dir|store' /etc/telemt/telemt.toml 2>/dev/null || echo 'none'
