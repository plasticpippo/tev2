#!/bin/sh
# Nginx entrypoint script that substitutes environment variables in the config

# Substitute only the specific variables we need
envsubst '$URL $NGINX_PORT $FRONTEND_PORT $BACKEND_PORT $CORS_ORIGIN' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/nginx.conf

# Start nginx
exec nginx -g 'daemon off;'
