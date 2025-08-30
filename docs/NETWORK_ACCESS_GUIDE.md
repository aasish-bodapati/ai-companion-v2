# Network Access Guide

## Accessing the AI Companion App from Other Devices

### Current Issue
The app is currently configured to only be accessible from `localhost` (127.0.0.1), which means other devices on your network cannot access it.

### Solution 1: Update Docker Compose (Recommended)

Edit your `docker-compose.yml` file to bind to all network interfaces:

```yaml
# Backend API
backend:
  # ... other config ...
  ports:
    - "0.0.0.0:8000:8000"  # Changed from "8000:8000"

# Frontend
frontend:
  # ... other config ...
  ports:
    - "0.0.0.0:3000:3000"  # Changed from "3000:3000"
```

### Solution 2: Find Your Computer's IP Address

1. **Windows**: Open Command Prompt and run:
   ```cmd
   ipconfig
   ```
   Look for "IPv4 Address" under your WiFi adapter (usually starts with 192.168.x.x or 10.0.x.x)

2. **Mac/Linux**: Open Terminal and run:
   ```bash
   ifconfig
   ```
   or
   ```bash
   ip addr show
   ```

### Solution 3: Update Frontend Configuration

If you want to hardcode the IP address, update `frontend/next.config.ts`:

```typescript
async rewrites() {
  if (process.env.NODE_ENV === 'development') {
    return [
      {
        source: '/api/:path*',
        destination: 'http://YOUR_COMPUTER_IP:8000/api/v1/:path*',
      },
    ];
  }
  return [];
},
```

### Access from Phone

1. Make sure your phone is connected to the same WiFi network
2. Use your computer's IP address instead of localhost:
   - Frontend: `http://YOUR_COMPUTER_IP:3000`
   - Backend API: `http://YOUR_COMPUTER_IP:8000`

### Security Note

Binding to `0.0.0.0` makes your app accessible to anyone on your local network. This is generally safe for development but consider using a firewall or VPN for production.

### Troubleshooting

1. **Firewall Issues**: Windows Firewall may block incoming connections. Allow the ports in Windows Defender Firewall.
2. **Antivirus**: Some antivirus software may block network access.
3. **Router Settings**: Ensure your router allows local network communication.

### Quick Test

After making changes:
1. Restart your Docker containers: `docker-compose down && docker-compose up -d`
2. Test from your computer: `http://localhost:3000`
3. Test from your phone: `http://YOUR_COMPUTER_IP:3000`
