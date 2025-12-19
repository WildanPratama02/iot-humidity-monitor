# Windows Deployment Guide: IoT Humidity Monitor

This guide explains how to deploy the IoT Humidity Monitor on a Windows Server (or dedicated PC) using NGINX as the web server and Reverse Proxy.

## Prerequisites
1.  **Node.js**: Installed (LTS version recommended).
2.  **PostgreSQL**: Installed and running.
3.  **Git**: To pull the project.

## 1. Install & Configure NGINX
1.  Download NGINX for Windows from [nginx.org](https://nginx.org/en/download.html).
2.  Extract the zip file to `C:\nginx` (recommended).
3.  Create a directory `C:\IoT\certificates` for your SSL keys.
    - Generate (or move) `server.crt` and `server.key` to this folder.
4.  Copy the content of `deploy/nginx.conf` from this project.
5.  Paste it into `C:\nginx\conf\nginx.conf` (replace existing content).
    - **Edit** the `ssl_certificate` paths in the config file if your paths are different.

## 2. Install Process Manager (PM2)
We use PM2 to keep the application running 24/7 and restart it if it crashes.
Open PowerShell as Administrator:
```powershell
npm install -g pm2
npm install -g pm2-windows-startup
pm2-startup install
```

## 3. Prepare Application
1.  Navigate to the project folder.
2.  Install dependencies:
    ```powershell
    # Root (Frontend)
    npm install
    npm run build

    # Backend
    cd backend
    npm install
    ```
3.  **Update Environment Variables**:
    
    **Frontend** (`.env.production`):
    ```ini
    # Point to the NGINX IP (which proxies to backend)
    # If using /api prefix in NGINX
    NEXT_PUBLIC_API_URL=https://192.168.43.175/api
    ```

    **Backend** (`backend/.env`):
    ```ini
    # NGINX handles SSL, so we just focus on the port.
    # App logic uses PORT+1 for HTTP. So if PORT=8090, HTTP is 8091.
    PORT=8090
    FRONTEND_URL=https://192.168.43.175
    ```

## 4. Start Application
Open terminal in the `deploy/` folder of the project:

```powershell
cd deploy
pm2 start ecosystem.config.js
pm2 save
```

## 5. Start NGINX
1.  Open terminal in `C:\nginx`.
2.  Run `start nginx`.

**Access the app:** `https://192.168.43.175`

## 6. Troubleshooting
- **Stop NGINX:** `nginx -s stop`
- **Reload NGINX:** `nginx -s reload`
- **PM2 Logs:** `pm2 logs`
- **Restart App:** `pm2 restart all`
