# LAN Access Configuration Guide

## Overview
This document describes how to configure the Bar POS system to be accessible from other devices on your local network (LAN).

## Configuration Steps

### 1. Update the Main Environment File
In the root `.env` file, set your LAN IP address:

```
LAN_IP=192.168.1.xxx  # Replace with your actual LAN IP address
```

### 2. Backend CORS Configuration
The backend automatically includes your LAN IP in the allowed origins based on the LAN_IP variable:

```
BACKEND_CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000,http://0.0.0.0:3000,http://${LAN_IP}:3000
```

### 3. Frontend API URL Handling
The frontend has been configured to dynamically determine the backend API URL based on the current hostname. When accessed from a LAN IP, it will automatically connect to the backend on the same IP address but port 3001.

## Finding Your LAN IP Address

To find your machine's IP address on the local network:

- **Linux/Mac**: Run `ip addr` or `ifconfig` in the terminal
- **Windows**: Run `ipconfig` in the command prompt

Look for your local network IP address (typically in the format `192.168.x.x`, `10.x.x.x`, or `172.x.x`).

## Running the Application

After configuring your LAN IP in the `.env` file:

```bash
docker compose up --build
```

## Accessing from Other Devices

Once the application is running, other devices on the same network can access it at:

```
http://[YOUR_LAN_IP]:3000
```

For example, if your LAN IP is `192.168.1.241`, access it at `http://192.168.1.241:3000`

## Troubleshooting

If you encounter issues:

1. Verify your firewall is not blocking ports 3000 and 3001
2. Confirm the IP address you're using is correct
3. Check that both backend and frontend services are running in Docker
4. Ensure you're on the same network as the server
5. Try accessing the backend directly at `http://[YOUR_LAN_IP]:3001/health` to verify connectivity