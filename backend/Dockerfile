# Use Node.js 20 Alpine as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install system dependencies for Prisma
RUN apk add --no-cache openssl libssl3 libc6-compat

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

# Build the application with explicit config
RUN npx tsc --project tsconfig.json

# Install only production dependencies for smaller image
RUN npm ci --only=production && npm cache clean --force

# Expose port
EXPOSE 3001

# Run the application
CMD ["npm", "start"]