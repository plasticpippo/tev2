# Use Node.js 20 Alpine as base image
FROM node:20-alpine

# Accept build arguments for version tracking
ARG APP_VERSION=dev
ARG BUILD_DATE=unknown

# Set labels for version tracking
LABEL app.name="assopos-backend" \
      app.version="${APP_VERSION}" \
      app.build.date="${BUILD_DATE}" \
      org.opencontainers.image.title="AssoPOS Backend" \
      org.opencontainers.image.version="${APP_VERSION}"

# Set working directory
WORKDIR /app

# Note: NODE_ENV is passed via docker-compose.yml environment variables
# - development: Detailed error messages, stack traces, debug logging
# - production: Generic error messages, no stack traces, secure logging
# Default: development (if not set in docker-compose.yml)

# Copy package files
COPY backend/package*.json ./

# Install system dependencies for Prisma, PostgreSQL client, and Puppeteer/Chromium
RUN apk add --no-cache openssl libssl3 libc6-compat wget postgresql-client \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Copy prisma files BEFORE generating Prisma client
COPY backend/prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy tsconfig.json
COPY backend/tsconfig.json ./

# Copy source code
COPY backend/src/ ./src/

# Copy shared types into src so TypeScript can import them within rootDir
# Must come AFTER backend/src/ to overwrite any symlink from the host
COPY shared/types.ts ./src/shared-types.ts

# Copy locales for i18n translations
COPY backend/locales/ ./locales/

# Copy templates for PDF generation
COPY backend/templates/ ./templates/

# Copy assets for PDF generation
COPY backend/assets/ ./assets/

# Build the application with explicit config
RUN npx tsc --project tsconfig.json

# Compile seed file to dist directory
RUN npx tsc prisma/seed.ts --outDir dist --target ES2020 --module commonjs --esModuleInterop

# Remove dev dependencies and clean npm cache
RUN npm prune --omit=dev && npm cache clean --force

# Expose port
EXPOSE 3001

# Copy entrypoint script
COPY backend/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Use entrypoint script to run migrations and seeding before starting app
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]