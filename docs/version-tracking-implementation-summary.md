# Version Tracking Implementation Summary

## Date: 2026-04-13

## Overview

Version tracking has been successfully implemented across the Bar POS application. This enables:
- Detection of application version at runtime
- Container identification via Docker labels
- API endpoint for version information
- Integration with install.sh for upgrade detection

## Changes Made

### 1. VERSION File
**Location:** `/VERSION`

**Format:**
```
VERSION=1.0.0
BUILD_DATE=2026-04-13
```

This file follows the environment variable format expected by `install.sh`.

### 2. Environment Variables (.env)
**Location:** `/.env` and `/backend/.env`

Added:
- `APP_VERSION=1.0.0` - Application version
- `BUILD_DATE=2026-04-13` - Build date

These are automatically populated by `install.sh` when reading the VERSION file.

### 3. Docker Compose Labels
**Location:** `docker-compose.yml`

Added version labels to all services:
```yaml
labels:
  app.name: "bar-pos-backend"  # or frontend, nginx, database
  app.version: ${APP_VERSION:-dev}
  app.build_date: ${BUILD_DATE:-unknown}
```

Also added `APP_VERSION` as a build argument for services that build from source (backend, frontend).

### 4. Backend Dockerfile Labels
**Location:** `backend/Dockerfile`

Added:
```dockerfile
ARG APP_VERSION=dev
ARG BUILD_DATE=unknown

LABEL app.name="bar-pos-backend" \
      app.version="${APP_VERSION}" \
      app.build.date="${BUILD_DATE}" \
      org.opencontainers.image.title="Bar POS Backend" \
      org.opencontainers.image.version="${APP_VERSION}"
```

### 5. Frontend Dockerfile Labels
**Location:** `frontend/Dockerfile`

Added:
```dockerfile
ARG APP_VERSION=dev
ARG BUILD_DATE=unknown

LABEL app.name="bar-pos-frontend" \
      app.version="${APP_VERSION}" \
      app.build.date="${BUILD_DATE}" \
      org.opencontainers.image.title="Bar POS Frontend" \
      org.opencontainers.image.version="${APP_VERSION}"
```

Also added `ENV VITE_APP_VERSION=${APP_VERSION}` to make version available to frontend build.

### 6. Backend API Version Endpoint
**Location:** `backend/src/router.ts`

Added new endpoint:
```typescript
app.get('/version', (req: Request, res: Response) => {
  res.json({
    name: 'bar-pos-backend',
    version: process.env.APP_VERSION || 'unknown',
    buildDate: process.env.BUILD_DATE || 'unknown',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    timestamp: new Date().toISOString()
  });
});
```

**Endpoint:** `GET /api/version`

**Response Example:**
```json
{
  "name": "bar-pos-backend",
  "version": "1.0.0",
  "buildDate": "2026-04-13",
  "environment": "production",
  "nodeVersion": "v20.0.0",
  "timestamp": "2026-04-13T10:00:00.000Z"
}
```

### 7. install.sh Integration
**Location:** `install.sh`

The script already had version detection functions:
- `get_installed_version()` - Reads from `.version` file
- `get_new_version()` - Reads from `VERSION` file
- `compare_versions()` - Compares versions
- `save_installed_version()` - Saves version after install/upgrade
- `perform_upgrade()` - Handles upgrade logic

Updated `write_env_files()` to read VERSION file and populate `APP_VERSION` and `BUILD_DATE` in `.env`.

### 8. Documentation
Created `docs/version-tracking.md` with:
- Version tracking overview
- File locations and formats
- How to update version
- How to check version
- Integration with CI/CD
- Troubleshooting guide

### 9. Verification Script
Created `test-version-tracking.sh` to verify:
- VERSION file exists with correct format
- .env has version variables
- Docker Compose has version labels
- Dockerfiles have version labels
- Backend has version endpoint
- Running containers have version labels
- Version endpoint responds correctly

**Usage:**
```bash
chmod +x test-version-tracking.sh
./test-version-tracking.sh
```

## Usage Examples

### Checking Version

**From VERSION file:**
```bash
grep "^VERSION=" VERSION | cut -d'=' -f2
# Output: 1.0.0
```

**From Docker container:**
```bash
docker inspect bar_pos_backend | jq '.[0].Config.Labels["app.version"]'
# Output: "1.0.0"
```

**From API endpoint:**
```bash
curl http://192.168.1.70/api/version
```

**All containers:**
```bash
for container in bar_pos_backend bar_pos_frontend bar_pos_nginx; do
  echo "$container: $(docker inspect $container | jq -r '.[0].Config.Labels["app.version"]')"
done
```

### Updating Version

**For a patch release (bug fixes):**
```bash
cat > VERSION << EOF
VERSION=1.0.1
BUILD_DATE=$(date +%Y-%m-%d)
EOF
```

**For a minor release (new features):**
```bash
cat > VERSION << EOF
VERSION=1.1.0
BUILD_DATE=$(date +%Y-%m-%d)
EOF
```

**For a major release (breaking changes):**
```bash
cat > VERSION << EOF
VERSION=2.0.0
BUILD_DATE=$(date +%Y-%m-%d)
EOF
```

Then rebuild:
```bash
docker compose up -d --build
```

## Files Modified

| File | Change |
|------|--------|
| `VERSION` | Updated to use env var format |
| `.env` | Added APP_VERSION and BUILD_DATE |
| `docker-compose.yml` | Added version labels to all services |
| `backend/Dockerfile` | Added version labels and build args |
| `frontend/Dockerfile` | Added version labels, build args, and env var |
| `backend/src/router.ts` | Added /version endpoint |
| `install.sh` | Updated write_env_files to read VERSION file |
| `docs/version-tracking.md` | Created comprehensive documentation |
| `test-version-tracking.sh` | Created verification script |

## Testing

To test version tracking:

1. **Run verification script:**
   ```bash
   ./test-version-tracking.sh
   ```

2. **Rebuild containers:**
   ```bash
   docker compose up -d --build
   ```

3. **Check version labels:**
   ```bash
   docker inspect bar_pos_backend | grep app.version
   ```

4. **Test API endpoint:**
   ```bash
   curl http://192.168.1.70/api/version | jq
   ```

## Next Steps

Version tracking is now complete. The following enhancements can be made in the future:

1. **Pre-upgrade database backup** - Create backups before running migrations
2. **Environment variable merge** - Merge new variables without overwriting existing
3. **Migration failure handling** - Better error handling for failed migrations
4. **Post-upgrade validation** - Automated checks after upgrade
5. **Rollback mechanism** - Automated rollback on failures
6. **UPGRADE.md** - Version-specific upgrade instructions when needed

## Notes

- The version format (`VERSION=x.y.z`) is compatible with existing `install.sh` functions
- Environment variables (`APP_VERSION`, `BUILD_DATE`) are used by Docker during build
- The API endpoint reads version information from runtime environment variables
- Container labels follow OCI (Open Container Initiative) specification
- All version information is consistent across VERSION file, .env, containers, and API

---

*Implementation completed: 2026-04-13*
