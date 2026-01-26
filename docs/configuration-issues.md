# Configuration Issues Report

## 1. Development Credentials in Production
- **Issue**: Default credentials are used in both development and production environments
- **Location**: `.env`, `docker-compose.yml`
- **Impact**: Risk of using weak/default credentials in production
- **Recommendation**: Separate development and production configurations

### Fix Proposal:
1. Create separate environment configuration files:
   - `.env.development`: For development environment
   ```env
   # Development Environment
   POSTGRES_USER=dev_user
   POSTGRES_PASSWORD=dev_password_strong_123
   POSTGRES_DB=bar_pos_dev
   JWT_SECRET=dev_jwt_secret_key_change_in_prod
   
   # Development-specific settings
   NODE_ENV=development
   BACKEND_CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
   ```

   - `.env.production`: For production environment
   ```env
   # Production Environment
   POSTGRES_USER=${PROD_POSTGRES_USER}
   POSTGRES_PASSWORD=${PROD_POSTGRES_PASSWORD}
   POSTGRES_DB=${PROD_POSTGRES_DB}
   JWT_SECRET=${PROD_JWT_SECRET}
   
   # Production-specific settings
   NODE_ENV=production
   BACKEND_CORS_ORIGIN=${PROD_CORS_ORIGINS}
   ```

   - `.env.example`: Template for developers
   ```env
   # Copy this file to .env and fill in your values
   POSTGRES_USER=totalevo_user
   POSTGRES_PASSWORD=your_secure_password_here
   POSTGRES_DB=bar_pos
   JWT_SECRET=your_jwt_secret_here
   ```

2. Update docker-compose.yml to use different environment files based on context
3. Implement environment validation to ensure required variables are present

## 2. Exposed Backend Port
- **Issue**: Backend port is exposed in docker-compose.yml making it accessible on the local network
- **Location**: `docker-compose.yml` line 43
- **Impact**: Unauthorized access to backend services
- **Recommendation**: Restrict backend access to internal network only

### Fix Proposal:
1. Update docker-compose.yml to remove external port exposure for backend:
```yaml
version: '3.8'

services:
  # Database service - internal only, not exposed to external network
  db:
    image: postgres:15
    container_name: bar_pos_backend_db
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-totalevo_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-totalevo_password}
      POSTGRES_DB: ${POSTGRES_DB:-bar_pos}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - pos_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-totalevo_user} -d ${POSTGRES_DB:-bar_pos}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API service - internal only, not exposed externally
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: bar_pos_backend
    environment:
      DATABASE_URL: "postgresql://${POSTGRES_USER:-totalevo_user}:${POSTGRES_PASSWORD:-totalevo_password}@db:5432/${POSTGRES_DB:-bar_pos}"
      PORT: ${BACKEND_PORT:-3001}
      HOST: 0.0.0.0
      NODE_ENV: ${NODE_ENV:-development}
      CORS_ORIGIN: ${BACKEND_CORS_ORIGIN}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - pos_network  # Only internal network access
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/health"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Frontend service - exposed to external network for LAN access
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: bar_pos_frontend
    environment:
      - VITE_API_URL=${FRONTEND_API_URL:-http://localhost:3001}
      - VITE_HOST=0.0.0.0
      - VITE_PORT=${FRONTEND_PORT:-3000}
    depends_on:
      backend:
        condition: service_healthy
    ports:
      - "${FRONTEND_EXTERNAL_PORT:-3000}:${FRONTEND_PORT:-3000}"
    restart: unless-stopped
    networks:
      - pos_network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 5

networks:
  pos_network:
    driver: bridge

volumes:
  postgres_data:
```

2. Update frontend to access backend through the internal network:
```typescript
// In frontend/services/apiBase.ts
const getApiBaseUrl = (): string => {
  // In development, use the VITE_API_URL from .env
  if ((import.meta as any).env.DEV) {
     return (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';
   }
   
   // In production, use internal service name for backend access
   // This allows the frontend container to reach the backend container
   return 'http://backend:3001'; // Internal docker service name
};
```

## 3. Insufficient CORS Configuration
- **Issue**: CORS policy includes localhost addresses but may be too permissive
- **Location**: `backend/src/index.ts` lines 13-21
- **Impact**: Potential security risk from overly permissive CORS
- **Recommendation**: Restrict CORS to only necessary origins

### Fix Proposal:
1. Implement a more restrictive CORS configuration:
```typescript
// In backend/src/index.ts
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Define allowed origins based on environment
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? [
          process.env.FRONTEND_URL || '',  // Production frontend URL
          process.env.ADMIN_PANEL_URL || '', // Admin panel URL if separate
        ].filter(Boolean) // Remove any empty strings
      : [
          'http://localhost:3000',
          'http://127.0.0.1:3000',
          'http://localhost:5173',
          'http://127.0.0.1:5173',
          // Add your specific development domains
        ];

    const isOriginAllowed = allowedOrigins.includes(origin);
    callback(null, isOriginAllowed);
  },
  credentials: true,
  optionsSuccessStatus: 200
};
```

2. Add environment-specific CORS configuration
3. Implement dynamic origin validation based on registered domains

## 4. Missing Security Headers Configuration
- **Issue**: While helmet is used, specific security header configuration may be insufficient
- **Location**: `backend/src/index.ts` line 45
- **Impact**: Potential security vulnerabilities
- **Recommendation**: Review and enhance security headers

### Fix Proposal:
1. Configure helmet with more specific security options:
```typescript
import helmet from 'helmet';

// Configure helmet with specific security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.example.com"], // Add your API endpoints
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny', // Prevent embedding in iframes
  },
  referrerPolicy: {
    policy: 'same-origin',
  },
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },
}));
```

## 5. Environment Variable Exposure
- **Issue**: Sensitive configuration may be exposed through environment variables
- **Location**: Multiple files accessing environment variables
- **Impact**: Risk of credential exposure
- **Recommendation**: Implement secure credential management

### Fix Proposal:
1. Add environment variable validation:
```typescript
// Create backend/src/config/env-validator.ts
interface EnvVars {
  DATABASE_URL: string;
  JWT_SECRET: string;
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  CORS_ORIGIN?: string;
}

export const validateEnv = (): EnvVars => {
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NODE_ENV'
  ];

  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
    NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
    PORT: parseInt(process.env.PORT || '3001', 10),
    CORS_ORIGIN: process.env.CORS_ORIGIN,
  };
};
```

2. Use this validation in the main index file:
```typescript
import { validateEnv } from './config/env-validator';

const env = validateEnv(); // Will throw error if required vars are missing
```

## 6. Docker Container Security
- **Issue**: No explicit security configurations for Docker containers
- **Location**: `docker-compose.yml`
- **Impact**: Potential container security vulnerabilities
- **Recommendation**: Implement container security best practices

### Fix Proposal:
1. Update docker-compose.yml with security configurations:
```yaml
services:
  # Database service with security enhancements
  db:
    image: postgres:15
    container_name: bar_pos_backend_db
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-totalevo_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-totalevo_password}
      POSTGRES_DB: ${POSTGRES_DB:-bar_pos}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - pos_network
    # Security configurations
    security_opt:
      - no-new-privileges:true
    read_only: true
    cap_drop:
      - ALL
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-totalevo_user} -d ${POSTGRES_DB:-bar_pos}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend service with security enhancements
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: bar_pos_backend
    environment:
      # ... environment variables
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - pos_network
    # Security configurations
    security_opt:
      - no-new-privileges:true
    read_only: true
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SETUID
      - SETGID
    user: "1000:1000"  # Run as non-root user
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/health"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Frontend service with security enhancements
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: bar_pos_frontend
    environment:
      # ... environment variables
    depends_on:
      backend:
        condition: service_healthy
    ports:
      - "${FRONTEND_EXTERNAL_PORT:-3000}:${FRONTEND_PORT:-3000}"
    restart: unless-stopped
    networks:
      - pos_network
    # Security configurations
    security_opt:
      - no-new-privileges:true
    read_only: true
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SETUID
      - SETGID
    user: "1000:1000"  # Run as non-root user
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 5
```

2. Update Dockerfiles to run as non-root users:
   - In backend/Dockerfile:
   ```dockerfile
   # Create non-root user
   RUN groupadd -r nodejs && useradd -r -g nodejs nodejs
   USER nodejs
   ```

   - In frontend/Dockerfile:
   ```dockerfile
   # Create non-root user
   RUN groupadd -r nginx-user && useradd -r -g nginx-user nginx-user
   USER nginx-user
   ```

## 7. Hardcoded API URLs
- **Issue**: API base URLs are constructed with hardcoded ports
- **Location**: `frontend/services/apiBase.ts` lines 46-47
- **Impact**: Reduced flexibility and potential deployment issues
- **Recommendation**: Make API URLs configurable

### Fix Proposal:
1. Update frontend/services/apiBase.ts to make API URLs configurable:
```typescript
const getApiBaseUrl = (): string => {
  // First, try to use the environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In development, default to localhost
  if ((import.meta as any).env.DEV) {
    return 'http://localhost:3001';
  }
  
  // In production, construct the API URL based on the current hostname
  // but different port, or use environment variable if available
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const backendPort = import.meta.env.VITE_BACKEND_PORT || '3001';
  
  // Allow override via environment variable for different deployment scenarios
  if (import.meta.env.VITE_USE_CURRENT_HOST) {
    return `${protocol}//${hostname}:${backendPort}`;
  }
  
  // Default to a configurable base URL
  return import.meta.env.VITE_FALLBACK_API_URL || `${protocol}//${hostname}:${backendPort}`;
};
```

2. Add configuration options to .env files:
```env
# Frontend configuration
VITE_API_URL=http://localhost:3001  # Or your actual backend URL
VITE_BACKEND_PORT=3001
VITE_USE_CURRENT_HOST=true  # Use current hostname instead of hardcoded localhost
VITE_FALLBACK_API_URL=