#!/bin/bash

#===============================================================================
# Version Tracking Verification Script
#
# This script verifies that version tracking is properly configured across
# the application components.
#===============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "Version Tracking Verification"
echo "=========================================="
echo ""

# Check 1: VERSION file exists and has correct format
echo "[CHECK 1] VERSION file"
if [[ -f "VERSION" ]]; then
    if grep -q "^VERSION=" VERSION && grep -q "^BUILD_DATE=" VERSION; then
        VERSION=$(grep "^VERSION=" VERSION | cut -d'=' -f2)
        BUILD_DATE=$(grep "^BUILD_DATE=" VERSION | cut -d'=' -f2)
        echo -e "${GREEN}✓${NC} VERSION file exists with correct format"
        echo "  Version: $VERSION"
        echo "  Build Date: $BUILD_DATE"
    else
        echo -e "${RED}✗${NC} VERSION file has incorrect format"
        exit 1
    fi
else
    echo -e "${RED}✗${NC} VERSION file not found"
    exit 1
fi
echo ""

# Check 2: .env file has version variables
echo "[CHECK 2] .env file version variables"
if grep -q "^APP_VERSION=" .env && grep -q "^BUILD_DATE=" .env; then
    ENV_VERSION=$(grep "^APP_VERSION=" .env | cut -d'=' -f2)
    ENV_BUILD_DATE=$(grep "^BUILD_DATE=" .env | cut -d'=' -f2)
    echo -e "${GREEN}✓${NC} .env has version variables"
    echo "  APP_VERSION: $ENV_VERSION"
    echo "  BUILD_DATE: $ENV_BUILD_DATE"
    
    if [[ "$VERSION" != "$ENV_VERSION" ]]; then
        echo -e "${YELLOW}⚠${NC} WARNING: VERSION file version ($VERSION) differs from .env APP_VERSION ($ENV_VERSION)"
    fi
else
    echo -e "${RED}✗${NC} .env missing version variables"
    exit 1
fi
echo ""

# Check 3: Docker Compose has version labels
echo "[CHECK 3] Docker Compose version labels"
if grep -q "app.version:" docker-compose.yml; then
    echo -e "${GREEN}✓${NC} docker-compose.yml has version labels"
else
    echo -e "${YELLOW}⚠${NC} docker-compose.yml missing version labels"
fi
echo ""

# Check 4: Backend Dockerfile has version labels
echo "[CHECK 4] Backend Dockerfile version labels"
if grep -q "app.version=" backend/Dockerfile; then
    echo -e "${GREEN}✓${NC} backend/Dockerfile has version labels"
else
    echo -e "${YELLOW}⚠${NC} backend/Dockerfile missing version labels"
fi
echo ""

# Check 5: Frontend Dockerfile has version labels
echo "[CHECK 5] Frontend Dockerfile version labels"
if grep -q "app.version=" frontend/Dockerfile; then
    echo -e "${GREEN}✓${NC} frontend/Dockerfile has version labels"
else
    echo -e "${YELLOW}⚠${NC} frontend/Dockerfile missing version labels"
fi
echo ""

# Check 6: Backend has version endpoint
echo "[CHECK 6] Backend version endpoint"
if grep -q "'/version'" backend/src/router.ts; then
    echo -e "${GREEN}✓${NC} Backend has /version endpoint"
else
    echo -e "${YELLOW}⚠${NC} Backend missing /version endpoint"
fi
echo ""

# Check 7: Container version labels (if containers are running)
echo "[CHECK 7] Running container version labels"
if docker ps --filter "name=bar_pos" --format "{{.Names}}" | grep -q .; then
    echo "Checking running containers..."
    for container in bar_pos_backend bar_pos_frontend bar_pos_nginx; do
        if docker ps --filter "name=$container" --format "{{.Names}}" | grep -q .; then
            CONTAINER_VERSION=$(docker inspect "$container" 2>/dev/null | jq -r '.[0].Config.Labels["app.version"]' 2>/dev/null || echo "unknown")
            if [[ "$CONTAINER_VERSION" != "null" && "$CONTAINER_VERSION" != "unknown" ]]; then
                echo -e "  ${GREEN}✓${NC} $container: $CONTAINER_VERSION"
            else
                echo -e "  ${YELLOW}⚠${NC} $container: version label not set"
            fi
        fi
    done
else
    echo -e "${YELLOW}⚠${NC} No containers running - skipping container checks"
fi
echo ""

# Check 8: Version endpoint (if backend is running)
echo "[CHECK 8] Backend /version endpoint response"
if curl -sf http://192.168.1.70/api/version > /dev/null 2>&1; then
    VERSION_RESPONSE=$(curl -s http://192.168.1.70/api/version)
    API_VERSION=$(echo "$VERSION_RESPONSE" | jq -r '.version' 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✓${NC} Backend version endpoint responding"
    echo "  API Version: $API_VERSION"
    
    if [[ "$VERSION" != "$API_VERSION" && "$API_VERSION" != "unknown" ]]; then
        echo -e "${YELLOW}⚠${NC} WARNING: VERSION file ($VERSION) differs from API response ($API_VERSION)"
    fi
else
    echo -e "${YELLOW}⚠${NC} Backend not responding - skipping endpoint check"
fi
echo ""

echo "=========================================="
echo "Verification Complete"
echo "=========================================="
