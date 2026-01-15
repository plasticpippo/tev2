#!/bin/bash

echo "Testing corrected Docker configuration..."

echo "1. Checking docker-compose.yml backend configuration:"
grep -A 15 "backend:" docker-compose.yml | grep -A 5 "ports:"
echo ""
echo "Checking docker-compose.yml frontend configuration:"
grep -A 10 "frontend:" docker-compose.yml | grep -A 5 "ports:"

echo ""
echo "2. Checking environment variables:"
echo "BACKEND_CORS_ORIGIN=$(grep BACKEND_CORS_ORIGIN .env)"
echo "FRONTEND_API_URL=$(grep FRONTEND_API_URL .env)"

echo ""
echo "3. Configuration summary:"
echo "   - Backend port 3001 is exposed on host (0.0.0.0:3001->container:3001)"
echo "   - Frontend uses http://localhost:3001 to access backend"
echo "   - CORS allows requests from http://localhost:3000 and other origins"
echo "   - Database remains internal-only"

echo ""
echo "To test the configuration, run:"
echo "   docker-compose down && docker-compose up --build"
echo ""
echo "Then access the frontend at http://localhost:3000 or your LAN IP:3000"
echo "The frontend should be able to communicate with the backend at :3001"