# Use Node.js 20 Alpine as base image for building
FROM node:20-alpine AS builder

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

# Copy built application from builder stage
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY frontend/nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]