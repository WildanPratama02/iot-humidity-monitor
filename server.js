const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Detect mode from NODE_ENV
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = parseInt(process.env.PORT, 10) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

app.prepare().then(() => {
    createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    }).listen(PORT, HOST, (err) => {
        if (err) throw err;
        const mode = dev ? 'DEVELOPMENT' : 'PRODUCTION';
        console.log(`
============================================
🚀 IoT Frontend - ${mode}
============================================
🌐 URL: http://${HOST}:${PORT}
🔗 Domain: ${dev ? 'localhost' : 'https://iot-humidity.qdms.web.id'}
📦 Mode: ${mode}
🔄 Hot Reload: ${dev ? 'Enabled' : 'Disabled'}
============================================
        `);
    });
});
