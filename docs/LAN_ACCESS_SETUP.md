# LAN Access Configuration Guide

This guide explains how to configure the Bar POS application to be accessible from other devices on your local network (LAN).

## Configuration

### Frontend Configuration

The frontend can be configured using environment variables in the `frontend/.env` file:

- `VITE_API_URL`: The URL of the backend API (default: `http://localhost:3001`)
- `VITE_HOST`: The host address the frontend server binds to (default: `0.0.0.0`)
- `VITE_PORT`: The port the frontend server runs on (default: `3000`)

### Backend Configuration

The backend can be configured using environment variables in the `backend/.env` file:

- `PORT`: The port the backend server runs on (default: `3001`)
- `HOST`: The host address the backend server binds to (default: `0.0.0.0`)

## How to Enable LAN Access

1. **Configure the backend to listen on all interfaces**:
   In `backend/.env`, set:
   ```
   HOST=0.0.0.0
   PORT=3001
   ```

2. **Configure the frontend to point to your machine's IP address**:
   In `frontend/.env`, set:
   ```
   VITE_API_URL=http://[YOUR_IP_ADDRESS]:3001
   VITE_HOST=0.0.0.0
   VITE_PORT=3000
   ```
   
   Replace `[YOUR_IP_ADDRESS]` with your actual machine's IP address on the local network (e.g., `192.168.1.100`).

3. **Start both servers**:
   ```bash
   npm run dev
   ```

4. **Access from other devices**:
   Other devices on the same network can now access the frontend at `http://[YOUR_IP_ADDRESS]:3000`

## Finding Your IP Address

To find your machine's IP address:

- **Linux/Mac**: Run `ip addr` or `ifconfig` in the terminal
- **Windows**: Run `ipconfig` in the command prompt

Look for your local network IP address (typically in the format `192.168.x.x`, `10.x.x.x`, or `172.x.x.x`).

## Security Considerations

- Only allow LAN access on trusted networks
- Avoid exposing the application to the public internet without proper security measures
- The default admin credentials are `admin`/`admin123` - change these in production
- The PostgreSQL database is configured to run in a Docker container and is not directly exposed to the network by default

## Troubleshooting

If you cannot access the application from other devices:

1. Verify that your firewall is not blocking the ports (3000 and 3001)
2. Ensure that the HOST is set to `0.0.0.0` in both frontend and backend
3. Confirm that the IP address you're using is correct
4. Check that both servers are running
5. Make sure you're on the same network as the server