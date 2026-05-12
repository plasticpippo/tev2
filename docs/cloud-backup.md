# TEV2 Cloud Backup with MEGA

Automated cloud backup system using [MEGA CMD](https://mega.io/cmd) for secure, encrypted off-site storage.

## Overview

| Component | Description |
|-----------|-------------|
| `scripts/setup-cloud-backup.sh` | First-time setup: install MEGA CMD, login, configure cron |
| `scripts/backup.sh --cloud` | Create full backup and upload to MEGA |
| `scripts/restore-cloud.sh` | Download from MEGA and restore everything |

**What gets backed up:**
- PostgreSQL database dump
- Docker volume: `storage_data` (receipts, PDFs)
- Docker volume: `uploads_data` (uploaded files)
- Configuration: `.env`, `VERSION`

**Cloud retention:** 30 backups (oldest auto-deleted on rotation)

**Remote folder:** `/TEV2/backups` on your MEGA account

---

## First-Time Setup

### 1. Run the setup script

```bash
cd /home/pippo/tev2
./scripts/setup-cloud-backup.sh
```

The script will:
1. Detect your OS and install MEGA CMD
2. Prompt for your MEGA email and password (password is not stored)
3. Create the `/TEV2/backups` folder on MEGA
4. Optionally configure a daily cron job

### 2. Verify setup

```bash
mega-whoami          # Should show your email
mega-ls /TEV2        # Should show "backups" folder
```

---

## Usage

### Create a cloud backup (manual)

```bash
./scripts/backup.sh --cloud --compress
```

This will:
1. Dump the PostgreSQL database locally
2. Export Docker volumes (storage_data, uploads_data)
3. Bundle everything with config files into a tar.gz
4. Upload to MEGA `/TEV2/backups/`
5. Rotate old backups (keep last 30)
6. Clean up the local archive (DB dump is kept in `./backups/`)

### List cloud backups

```bash
./scripts/restore-cloud.sh --list
# or directly:
mega-ls /TEV2/backups
```

### Restore from cloud

```bash
# Restore the latest backup
./scripts/restore-cloud.sh

# Restore a specific backup
./scripts/restore-cloud.sh --file tev2_full_20260511_040000.tar.gz

# Restore database only (skip volumes and config)
./scripts/restore-cloud.sh --db-only

# Skip confirmation prompt
./scripts/restore-cloud.sh --force
```

### Local-only backup (without cloud)

```bash
# These still work exactly as before
./scripts/backup.sh
./scripts/backup.sh --compress
./scripts/restore.sh
```

---

## Automatic Backups (Cron)

The setup script can configure a daily cron job. To check or modify it:

```bash
# View current cron
crontab -l

# Remove the cron job
crontab -l | grep -v "TEV2-cloud-backup" | crontab -

# Add a cron job manually (daily at 4am)
(crontab -l 2>/dev/null; echo "0 4 * * * /home/pippo/tev2/scripts/backup.sh --cloud --compress >> /home/pippo/tev2/backups/cloud-backup.log 2>&1 # TEV2-cloud-backup") | crontab -
```

### Check cron logs

```bash
tail -50 /home/pippo/tev2/backups/cloud-backup.log
```

---

## MEGA CMD Reference

Common commands for manual operations:

```bash
mega-whoami                    # Check login status
mega-ls /TEV2/backups         # List cloud backups
mega-du -h /TEV2/backups      # Show storage usage
mega-get /TEV2/backups/FILE   # Download a specific file
mega-rm /TEV2/backups/FILE    # Delete a specific backup
mega-logout                    # Logout
mega-login email password      # Login
```

---

## Uninstall

To remove the cron job and logout from MEGA:

```bash
./scripts/setup-cloud-backup.sh --uninstall
```

This does NOT delete your backups from MEGA. To delete them:

```bash
mega-rm -r /TEV2
```

---

## Troubleshooting

### "Not logged into MEGA"

MEGA sessions persist in `~/.megaCmd/`. If the session expires:

```bash
mega-login your-email@example.com your-password
```

### "mega-put: command not found"

MEGA CMD is not installed or not in PATH:

```bash
./scripts/setup-cloud-backup.sh
```

### "Upload failed"

Check your MEGA storage quota:

```bash
mega-df -h
```

Free accounts have limited storage. If full, delete old backups:

```bash
mega-ls /TEV2/backups
mega-rm /TEV2/backups/tev2_full_OLD_FILE.tar.gz
```

### Cloud backup is slow

Upload speed depends on your internet connection and MEGA's server load. For large volumes, consider:

- Using `--db-only` for frequent backups
- Running full backups less frequently

### MEGA CMD server not running

MEGA CMD runs a background server. If commands fail:

```bash
# The server starts automatically on first mega- command
mega-version
```

If it still fails, kill any stale processes:

```bash
pkill -f mega-cmd-server
mega-version
```
