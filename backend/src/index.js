/**
 * IoT Humidity Monitor - Backend Server
 * Express.js with JWT Authentication and RBAC
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Import controllers
const authController = require('./controllers/authController');
const dataController = require('./controllers/dataController');
const notificationController = require('./controllers/notificationController');
const deviceController = require('./controllers/deviceController');

// Import middleware
const { verifyToken, verifyAdmin, optionalToken } = require('./middleware/auth');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 8090;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express.json());

// Request logging (development only)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// ============================================
// PUBLIC ROUTES (No auth required)
// ============================================

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test database connection
app.get('/test-db', async (req, res) => {
    try {
        const pool = require('./config/database');
        const result = await pool.query('SELECT NOW()');
        res.json({ 
            success: true, 
            message: 'Database connected',
            time: result.rows[0].now 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Database connection failed',
            error: error.message 
        });
    }
});

// Authentication
app.post('/auth/login', authController.login);

// Get VAPID public key for push subscription
app.get('/notifications/vapid-public-key', notificationController.getVapidPublicKey);

// ============================================
// PROTECTED ROUTES (Auth required)
// ============================================

// Get current user profile
app.get('/auth/me', verifyToken, authController.getCurrentUser);

// Save push subscription (requires login to link to user)
app.post('/notifications/subscribe', verifyToken, notificationController.saveSubscription);

// ============================================
// ADMIN ONLY ROUTES
// ============================================

// User management
app.post('/users', verifyToken, verifyAdmin, authController.register);
app.get('/users', verifyToken, verifyAdmin, authController.getAllUsers);
app.delete('/users/:id', verifyToken, verifyAdmin, authController.deleteUser);

// Device management
app.get('/admin/devices', verifyToken, verifyAdmin, deviceController.getAllDevices);
app.post('/admin/devices', verifyToken, verifyAdmin, deviceController.createDevice);
app.put('/admin/devices/:id', verifyToken, verifyAdmin, deviceController.updateDevice);
app.delete('/admin/devices/:id', verifyToken, verifyAdmin, deviceController.deleteDevice);

// Get all locations (admin can see all)
app.get('/locations', verifyToken, dataController.getAllLocations);

// ============================================
// DATA ROUTES (IoT Device Data)
// ============================================

// These routes remain public for IoT devices to push data
// Or can be protected with device-specific API keys

// Get all devices
app.get('/devices', dataController.getAllDevices);

// Get sensor data by device
app.get('/data/:deviceId', dataController.getDataByDevice);

// Insert sensor data (from IoT devices)
app.post('/data', dataController.insertData);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route tidak ditemukan'
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
    });
});

// ============================================
// START SERVER
// ============================================

const fs = require('fs');
const https = require('https');
const http = require('http');

const startServer = () => {
    // Run HTTP only - NGINX handles SSL termination
    http.createServer(app).listen(PORT, '0.0.0.0', () => {
        console.log(`
============================================
🚀 IoT Humidity Monitor Backend
============================================
🌐 HTTP Server: http://0.0.0.0:${PORT}
📡 Ready for NGINX reverse proxy
📅 Started at: ${new Date().toISOString()}
============================================
        `);
    });
};

startServer();

module.exports = app;
