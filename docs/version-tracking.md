# Version Tracking Guide

## Overview

This document describes the version tracking system implemented for the Bar POS application. Version tracking enables:

- Detection of when upgrades are needed
- Identification of breaking changes
- Tracking of deployed application versions
- Rollback capabilities

## Version File

The project uses a `VERSION` file at the root directory to track the application version.

**Location:** `/VERSION`

**Format:** Environment variable style with version and build date

**Current Version:** `VERSION=1.0.0`

### Example

```
VERSION=1.0.0
BUILD_DATE=2026-04-13
```

## Environment Variables

Version information is passed through environment variables:

| Variable | Purpose | Default |
|----------|---------|---------|
| `APP_VERSION` | Application version from VERSION file | `dev` |
| `BUILD_DATE` | Date/time of build | `unknown` |

These are defined in `.env` and passed to Docker containers during build.

## Docker Labels

All Docker containers have version labels for easy identification:

```bash
docker inspect bar_pos_backend | grep -A 5 '"Labels"'
```

**Example Output:**
```json
"Labels": {
  "app.name": "bar-pos-backend",
  "app.version": "1.0.0",
  "app.build.date": "2026-04-13",
  "org.opencontainers.image.title": "Bar POS Backend",
  "org.opencontainers.image.version": "1.0.0"
}
```

## API Version Endpoint

The backend provides a version endpoint for runtime version checking:

**Endpoint:** `GET /api/version`

**Response:**
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

**Usage:**
```bash
curl http://192.168.1.70/api/version
```

## Updating Version

When preparing a new release:

1. **Update the VERSION file:**
   ```bash
   # Patch release (bug fixes)
   cat > VERSION << EOF
   VERSION=1.0.1
   BUILD_DATE=$(date +%Y-%m-%d)
   EOF

   # Minor release (new features)
   cat > VERSION << EOF
   VERSION=1.1.0
   BUILD_DATE=$(date +%Y-%m-%d)
   EOF

   # Major release (breaking changes)
   cat > VERSION << EOF
   VERSION=2.0.0
   BUILD_DATE=$(date +%Y-%m-%d)
   EOF
   ```

2. **Update .env BUILD_DATE:**
   ```bash
   BUILD_DATE=$(date +%Y-%m-%d)
   sed -i "s/^BUILD_DATE=.*/BUILD_DATE=$BUILD_DATE/" .env
   ```

3. **Update package.json versions (if needed):**
   ```bash
   # Backend
   npm version patch  # or minor/major

   # Frontend
   cd frontend && npm version patch
   ```

4. **Commit changes:**
   ```bash
   git add VERSION .env backend/package.json frontend/package.json
   git commit -m "chore: bump version to 1.0.1"
   git tag v1.0.1
   git push origin master --tags
   ```

## Semantic Versioning

We follow Semantic Versioning 2.0.0: https://semver.org/

### MAJOR (X.0.0)
- Incompatible API changes
- Breaking changes in database schema
- Significant architectural changes

### MINOR (0.X.0)
- Backwards-compatible functionality additions
- New API endpoints
- New features in existing models

### PATCH (0.0.X)
- Backwards-compatible bug fixes
- Performance improvements
- Documentation updates

## Checking Version

### Before Upgrading

```bash
# Check current git version
grep "VERSION=" VERSION | cut -d'=' -f2
```

### After Upgrading

```bash
# Verify new version is running
docker inspect bar_pos_backend | grep app.version

# Check all containers
for container in bar_pos_backend bar_pos_frontend bar_pos_nginx bar_pos_backend_db; do
  echo "=== $container ==="
  docker inspect $container | grep -A 2 '"Labels"' | grep app.version
done
```

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-04-13 | Initial versioned release |

## Upgrade Path Compatibility

When upgrading, verify compatibility:

1. **Check version gap:** Large jumps (e.g., 1.0.0 → 2.0.0) may require manual steps
2. **Review migration files:** Check for breaking changes in `backend/prisma/migrations/`
3. **Read UPGRADE.md:** Look for version-specific upgrade instructions

## Troubleshooting

### Version Not Updating

If the version doesn't update after rebuild:

```bash
# Force rebuild without cache
docker compose build --no-cache backend frontend
docker compose up -d

# Verify
docker inspect bar_pos_backend | grep app.version
```

### Missing Version Labels

If containers don't have version labels:

```bash
# Check environment variables
docker exec bar_pos_backend env | grep APP_VERSION

# Rebuild with proper .env
docker compose down
docker compose up -d --build
```

## Integration with CI/CD

For automated deployments, version tracking can be integrated:

```bash
#!/bin/bash
# ci-build.sh

VERSION=$(cat VERSION)
BUILD_DATE=$(date +%Y-%m-%d)

export APP_VERSION=$VERSION
export BUILD_DATE=$BUILD_DATE

docker compose build
docker compose push
```

## Related Files

- `VERSION` - Application version file
- `.env` - Environment configuration with APP_VERSION and BUILD_DATE
- `docker-compose.yml` - Container labels
- `backend/Dockerfile` - Backend container labels
- `frontend/Dockerfile` - Frontend container labels
- `backend/src/router.ts` - Version API endpoint
- `UPGRADE.md` - Version-specific upgrade instructions (when needed)

---

*Last updated: 2026-04-13*
