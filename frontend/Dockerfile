# Use Node.js 20 Alpine as base image for building
FROM node:20-alpine AS builder

# Accept build arguments for Vite environment variables and version tracking
ARG VITE_API_URL
ARG VITE_HOST
ARG VITE_PORT
ARG APP_VERSION=dev

# Set environment variables for Vite build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_HOST=${VITE_HOST}
ENV VITE_PORT=${VITE_PORT}
ENV VITE_APP_VERSION=${APP_VERSION}

# Set working directory
WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Create directory structure to mirror project root
RUN mkdir -p frontend

# Copy frontend source code to frontend directory first
COPY frontend/ ./frontend/

# Copy shared directory directly into frontend directory
COPY shared ./frontend/shared

# Build the application
RUN cd frontend && npm run build

# Use nginx to serve the built application
FROM nginx:alpine

# Accept build args for version tracking
ARG APP_VERSION=dev
ARG BUILD_DATE=unknown

# Set labels for version tracking
LABEL app.name="bar-pos-frontend" \
      app.version="${APP_VERSION}" \
      app.build.date="${BUILD_DATE}" \
      org.opencontainers.image.title="Bar POS Frontend" \
      org.opencontainers.image.version="${APP_VERSION}"

# Copy built application from builder stage
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY frontend/nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]