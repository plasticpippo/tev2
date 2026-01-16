# CORS and Environment Configuration Plan

## Current Issues Identified

1. **Inconsistent CORS Configuration**: The backend's CORS configuration doesn't properly allow LAN access
2. **Hardcoded Values**: Both backend and frontend have hardcoded IP addresses in their .env files
3. **Missing Environment Variable Propagation**: Docker Compose isn't properly passing all environment variables to containers
4. **Overly Permissive Nginx CORS**: The nginx configuration sets `Access-Control-Allow-Origin *` which is not ideal for security

## Solution Approach

### Phase 1: Environment Variable Standardization

1. **Update Main .env File**:
   - Add proper LAN IP detection support
   - Make CORS origin configurable for different environments
   - Define consistent variable naming

2. **Fix Docker Compose Configuration**:
   - Ensure all environment variables are properly passed to containers
   - Configure CORS origin to accept both container names and LAN IPs

### Phase 2: Backend CORS Configuration

1. **Modify Backend CORS Setup**:
   - Update the CORS configuration in `backend/src/index.ts` to accept environment variable
   - Support multiple origins including LAN addresses

2. **Update Backend Dockerfile**:
   - Ensure the container uses environment variables instead of hardcoded values

### Phase 3: Frontend Configuration

1. **Fix Frontend Environment**:
   - Update `frontend/.env` to use variable substitution
   - Ensure API URL can be configured via environment variables

2. **Update Frontend Dockerfile and Nginx**:
   - Remove overly permissive CORS headers from nginx config
   - Allow backend to handle CORS properly

## Detailed Implementation Steps

### Step 1: Update the main .env file
```env
# Database Configuration
POSTGRES_USER=totalevo_user
POSTGRES_PASSWORD=totalevo_password
POSTGRES_DB=bar_pos
DB_HOST=localhost
DB_PORT=5432

# Backend Configuration
BACKEND_PORT=3001
BACKEND_EXTERNAL_PORT=3001
NODE_ENV=development
# Allow both container networking and LAN access
BACKEND_CORS_ORIGIN=http://frontend:3000,http://localhost:3000,http://127.0.0.1:3000,http://0.0.0.0:3000,http://192.168.0.0/16,http://10.0.0/8,http://172.16.0.0/12

# Frontend Configuration
FRONTEND_PORT=3000
FRONTEND_EXTERNAL_PORT=3000
FRONTEND_API_URL=http://backend:3001
# Allow specifying LAN IP for development
LAN_IP=${LAN_IP:-localhost}
FRONTEND_LAN_URL=http://${LAN_IP}:3000
```

### Step 2: Update Docker Compose to properly pass variables
Ensure the docker-compose.yml properly passes all environment variables to services

### Step 3: Update backend CORS configuration
Modify the CORS configuration in `backend/src/index.ts` to properly parse and use the BACKEND_CORS_ORIGIN environment variable

### Step 4: Clean up backend/.env
Remove hardcoded values and rely on environment variables passed from Docker Compose

### Step 5: Update frontend configuration
Modify frontend to work with the corrected API URL configuration

### Step 6: Update nginx configuration
Remove overly permissive CORS headers from nginx.conf and let the backend handle CORS properly

## Expected Outcome

After implementing these changes:
1. The frontend will be able to communicate with the backend without CORS issues
2. Both local and LAN access will work properly
3. Environment variables will be consistently managed across all components
4. The system will be secure while still allowing necessary cross-origin requests