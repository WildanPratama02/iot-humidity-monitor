const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

// Detect mode from NODE_ENV
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '192.168.43.175';

// SSL certificates
const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'server.key')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'server.crt'))
};

app.prepare().then(() => {
    createServer(httpsOptions, (req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    }).listen(PORT, HOST, (err) => {
        if (err) throw err;
        const mode = dev ? 'DEVELOPMENT' : 'PRODUCTION';
        console.log(`
============================================
🔒 IoT Frontend (HTTPS) - ${mode}
============================================
🌐 URL: https://${HOST}:${PORT}
📦 Mode: ${mode}
🔄 Hot Reload: ${dev ? 'Enabled' : 'Disabled'}
============================================
        `);
    });
});
