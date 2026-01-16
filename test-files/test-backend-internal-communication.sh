
#!/bin/bash

echo "Testing internal communication between frontend and backend containers..."

# Build and start the services
echo "Starting Docker containers..."
docker compose up --build -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 15

# Check if containers are running
echo "Checking running containers..."
docker compose ps

# Test backend health endpoint internally
echo "Testing backend health internally..."
docker compose exec backend wget --quiet --tries=1 --spider http://localhost:3001/health && echo "Backend health check: OK" || echo "Backend health check: FAILED"

# Test backend accessibility from frontend container using the internal container name
echo "Testing backend accessibility from frontend container..."
docker compose exec frontend wget --quiet --tries=1 --spider http://backend:3001/health && echo "Internal communication (frontend -> backend): OK" || echo "Internal communication (frontend -> backend): FAILED"

# Test API endpoint accessibility from frontend container
echo "Testing API endpoint accessibility from frontend container..."
if docker compose exec frontend wget --quiet --tries=1 --spider http://backend:3001/api/users; then
    echo "API endpoint access (frontend -> backend): OK"
else
    # If the users endpoint doesn't exist, try health endpoint
    if docker compose exec frontend wget --quiet --tries=1 --spider http://backend:3001/health; then
        echo "Health endpoint access (frontend -> backend): OK"
    else
        echo "API endpoint access (frontend -> backend): FAILED"
    fi
fi

# Test that backend port is not accessible externally
echo "Testing that backend port is not exposed externally..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null || echo "blocked")
if [[ "$response" == "blocked" ]] || [[ "$response" -ge 400 ]]; then
    echo "Backend external access correctly blocked: OK"
else
    echo "Backend external access still available: FAILED (Status: $response)"
fi

# Test CORS headers for internal communication
echo "Testing CORS headers for internal communication..."
docker compose exec frontend curl -s -o /dev/null -w "CORS Test - Status Code: %{http_code}\n" -H "Origin: http://frontend:3000" -H "Access-Control-Request-Method: POST" -X OPTIONS http://backend:3001/health

# Additional test: Check if the frontend can reach backend API with proper headers
echo "Testing API communication with headers..."
docker compose exec frontend curl -s -H "Content-Type: application/json" -w "API Test - Status Code: %{http_code}\n" -o /dev/null http://backend:3001/health

# Print network configuration details
echo "Displaying container network details..."
docker compose exec backend cat /etc/hosts
docker compose exec frontend ping -c 3 backend

# Stop the services
echo "Stopping Docker containers..."
docker compose down

