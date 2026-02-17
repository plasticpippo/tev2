# Use Node.js 20 Alpine as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Note: NODE_ENV is passed via docker-compose.yml environment variables
# - development: Detailed error messages, stack traces, debug logging
# - production: Generic error messages, no stack traces, secure logging
# Default: development (if not set in docker-compose.yml)

# Copy package files
COPY package*.json ./

# Install system dependencies for Prisma
RUN apk add --no-cache openssl libssl3 libc6-compat wget

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Copy prisma files BEFORE generating Prisma client
COPY prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy tsconfig.json
COPY tsconfig.json ./

# Copy source code
COPY src/ ./src/

# Copy locales for i18n translations
COPY locales/ ./locales/

# Build the application with explicit config
RUN npx tsc --project tsconfig.json

# Install all dependencies including dev dependencies for seeding
RUN npm install && npm cache clean --force

# Compile seed file to dist directory
RUN npx tsc prisma/seed.ts --outDir dist --target ES2020 --module commonjs --esModuleInterop

# Expose port
EXPOSE 3001

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Use entrypoint script to run migrations and seeding before starting app
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]