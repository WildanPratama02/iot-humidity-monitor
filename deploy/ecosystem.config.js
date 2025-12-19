module.exports = {
  apps: [
    {
      name: "iot-frontend",
      cwd: "../", // From deploy/ folder to root
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000", // Run Next.js on port 3000 (HTTP)
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        // Environment variables will be loaded from .env.production
      }
    },
    {
      name: "iot-backend",
      cwd: "../backend", // From deploy/ folder to backend
      script: "src/index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 8090, // Note: The code creates HTTP on PORT+1 (8091). We need 8091 for NGINX.
        // If we set PORT=8090, index.js creates HTTP server on 8091.
        // We will proxy to 8091.
      }
    }
  ]
};
