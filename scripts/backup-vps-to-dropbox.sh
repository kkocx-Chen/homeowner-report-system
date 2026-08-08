#!/usr/bin/env bash

# Creates a restorable filesystem backup, a consistent physical MySQL snapshot,
# and recovery metadata, then uploads the result to the configured Dropbox remote.

set -euo pipefail

umask 077

backup_root=/root/server-backups
dropbox_remote=backup_dropbox:server-backups
host_name=$(hostname -s)
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
snapshot_dir="$backup_root/$host_name-$timestamp"
metadata_dir="$snapshot_dir/metadata"
filesystem_archive="$snapshot_dir/$host_name-filesystem.tar.zst"
mysql_archive="$snapshot_dir/$host_name-mysql-physical.tar.zst"
metadata_archive="$snapshot_dir/$host_name-recovery-metadata.tar.zst"
remote_snapshot="$dropbox_remote/$host_name/$timestamp"
rclone_log="$backup_root/$host_name-$timestamp-rclone.log"
mysql_was_stopped=false

restart_mysql_if_needed() {
  if [[ "$mysql_was_stopped" == true ]]; then
    systemctl start mysqld || true
  fi
}

trap restart_mysql_if_needed EXIT

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    printf 'Required command is missing: %s\n' "$1" >&2
    exit 1
  }
}

for command in tar zstd rclone sha256sum systemctl; do
  require_command "$command"
done

mkdir -p "$metadata_dir"

printf '%s\n' "$timestamp" > "$metadata_dir/backup-started-utc.txt"
printf '%s\n' "$host_name" > "$metadata_dir/hostname.txt"
uname -a > "$metadata_dir/kernel.txt"
hostnamectl > "$metadata_dir/hostnamectl.txt" 2>&1 || true
lsblk --bytes --output NAME,SIZE,FSTYPE,TYPE,MOUNTPOINTS > "$metadata_dir/block-devices.txt" 2>&1 || true
findmnt -a > "$metadata_dir/mounts.txt" 2>&1 || true
df -hT > "$metadata_dir/filesystems.txt" 2>&1 || true
dpkg-query -W > "$metadata_dir/debian-packages.tsv" 2>&1 || true
systemctl list-unit-files --state=enabled --no-legend > "$metadata_dir/enabled-services.txt" 2>&1 || true
systemctl list-units --type=service --state=running --no-legend > "$metadata_dir/running-services.txt" 2>&1 || true
crontab -l > "$metadata_dir/root-crontab.txt" 2>&1 || true
nft list ruleset > "$metadata_dir/nftables-ruleset.txt" 2>&1 || iptables-save > "$metadata_dir/iptables-ruleset.txt" 2>&1 || true
printf '%s\n' \
  'This snapshot contains a whole persistent filesystem archive and a cold MySQL physical archive.' \
  'Restore the filesystem first, then use the MySQL archive to replace /www/server/data before starting mysqld.' \
  'Virtual filesystems /proc, /sys, /dev, /run and /tmp are intentionally excluded.' \
  'The archive includes confidential keys and environment files; keep it private.' \
  > "$metadata_dir/RESTORE-NOTES.txt"

rclone about backup_dropbox: --json > "$metadata_dir/dropbox-capacity-before.json"

if systemctl is-active --quiet mysqld; then
  printf '%s\n' 'Creating consistent MySQL physical snapshot…'
  systemctl stop mysqld
  mysql_was_stopped=true
  tar --create --file="$mysql_archive" --use-compress-program='zstd -T1 -3' \
    --acls --xattrs --numeric-owner --sparse --warning=no-file-changed \
    --directory=/ www/server/data
  systemctl start mysqld
  systemctl is-active --quiet mysqld
  mysql_was_stopped=false
else
  printf '%s\n' 'mysqld was not active; no separate physical MySQL snapshot was required.' > "$metadata_dir/mysql-snapshot-status.txt"
fi

printf '%s\n' 'Creating whole persistent filesystem archive…'
tar --create --file="$filesystem_archive" --use-compress-program='zstd -T1 -3' \
  --acls --xattrs --numeric-owner --sparse --one-file-system --ignore-failed-read --warning=no-file-changed \
  --exclude=root/server-backups --exclude='root/server-backups/*' \
  --exclude=./root/server-backups --exclude='./root/server-backups/*' \
  --exclude=proc --exclude='proc/*' \
  --exclude=sys --exclude='sys/*' \
  --exclude=dev --exclude='dev/*' \
  --exclude=run --exclude='run/*' \
  --exclude=tmp --exclude='tmp/*' \
  --exclude=mnt --exclude='mnt/*' \
  --exclude=media --exclude='media/*' \
  --exclude=lost+found \
  --directory=/ .

tar --create --file="$metadata_archive" --use-compress-program='zstd -T1 -3' \
  --acls --xattrs --numeric-owner --warning=no-file-changed \
  --directory="$snapshot_dir" metadata

sha256sum "$filesystem_archive" "$mysql_archive" "$metadata_archive" > "$snapshot_dir/SHA256SUMS"
du -h "$filesystem_archive" "$mysql_archive" "$metadata_archive" > "$snapshot_dir/ARCHIVE-SIZES.txt"
printf '%s\n' "$remote_snapshot" > "$snapshot_dir/DROPBOX-LOCATION.txt"

printf '%s\n' 'Uploading backup to Dropbox…'
rclone copy "$snapshot_dir" "$remote_snapshot" --exclude 'rclone-*.log' --checkers 4 --transfers 1 --log-file="$rclone_log" --log-level INFO
rclone check "$snapshot_dir" "$remote_snapshot" --exclude 'rclone-*.log' --size-only --log-file="$rclone_log" --log-level INFO

printf '%s\n' "Backup complete: $remote_snapshot"
