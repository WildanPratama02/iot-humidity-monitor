/**
 * Notification Controller
 * Handles push subscription management and targeted notifications
 */
const webpush = require('web-push');
const pool = require('../config/database');

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_EMAIL || 'mailto:admin@example.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

/**
 * Save Push Subscription
 * POST /notifications/subscribe
 * Body: { endpoint, keys: { p256dh, auth } }
 * Headers: Authorization: Bearer <token> (required to link subscription to user)
 */
const saveSubscription = async (req, res) => {
    try {
        console.log('[Notification] saveSubscription called');
        console.log('[Notification] Body:', JSON.stringify(req.body, null, 2));
        console.log('[Notification] User from token:', req.user);
        
        const { endpoint, keys } = req.body;
        const userId = req.user?.userId; // From verifyToken middleware

        if (!endpoint || !keys) {
            console.log('[Notification] Error: Missing endpoint or keys');
            return res.status(400).json({
                success: false,
                message: 'Subscription data tidak lengkap'
            });
        }

        if (!userId) {
            console.log('[Notification] Error: No userId from token');
            return res.status(401).json({
                success: false,
                message: 'User harus login untuk mendaftarkan notifikasi'
            });
        }

        // Check if subscription already exists
        const existing = await pool.query(
            'SELECT id FROM tb_subscriptions WHERE endpoint = $1',
            [endpoint]
        );

        if (existing.rows.length > 0) {
            // Update existing subscription with new user_id
            await pool.query(
                'UPDATE tb_subscriptions SET user_id = $1, p256dh = $2, auth = $3 WHERE endpoint = $4',
                [userId, keys.p256dh, keys.auth, endpoint]
            );
        } else {
            // Insert new subscription
            await pool.query(
                'INSERT INTO tb_subscriptions (endpoint, p256dh, auth, user_id) VALUES ($1, $2, $3, $4)',
                [endpoint, keys.p256dh, keys.auth, userId]
            );
        }

        res.json({
            success: true,
            message: 'Subscription berhasil disimpan'
        });

    } catch (error) {
        console.error('Save subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

/**
 * Send Targeted Notification to PIC
 * Called when sensor threshold is exceeded
 * @param {string} location - Device location
 * @param {object} alertData - { title, body, deviceId, temp, hum }
 */
const sendTargetedNotification = async (location, alertData) => {
    try {
        console.log(`📍 Sending targeted notification for location: ${location}`);

        // Step 1: Find PIC user(s) assigned to this location
        const picUsers = await pool.query(
            `SELECT u.id, u.username, u.assigned_location 
             FROM tb_users u 
             WHERE u.role = 'pic' AND u.assigned_location = $1`,
            [location]
        );

        if (picUsers.rows.length === 0) {
            console.log(`⚠️ No PIC assigned to location: ${location}`);
            return { sent: 0, failed: 0 };
        }

        const picUserIds = picUsers.rows.map(u => u.id);
        console.log(`👤 Found ${picUserIds.length} PIC(s) for location: ${location}`);

        // Step 2: Get push subscriptions for these PICs
        const subscriptions = await pool.query(
            `SELECT s.id, s.endpoint, s.p256dh, s.auth, s.user_id
             FROM tb_subscriptions s
             WHERE s.user_id = ANY($1)`,
            [picUserIds]
        );

        if (subscriptions.rows.length === 0) {
            console.log(`⚠️ No push subscriptions found for PICs at location: ${location}`);
            return { sent: 0, failed: 0 };
        }

        console.log(`📱 Found ${subscriptions.rows.length} subscription(s) to notify`);

        // Step 3: Send push notifications
        const payload = JSON.stringify({
            title: alertData.title || `⚠️ ALERT: ${location}`,
            body: alertData.body || 'Threshold exceeded!',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            data: {
                deviceId: alertData.deviceId,
                location: location,
                temp: alertData.temp,
                hum: alertData.hum,
                timestamp: new Date().toISOString()
            }
        });

        let sent = 0;
        let failed = 0;
        const failedSubscriptionIds = [];

        for (const sub of subscriptions.rows) {
            try {
                const pushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth
                    }
                };

                await webpush.sendNotification(pushSubscription, payload);
                sent++;
                console.log(`✅ Notification sent to subscription ${sub.id}`);

            } catch (error) {
                failed++;
                console.error(`❌ Failed to send to subscription ${sub.id}:`, error.message);

                // If subscription is no longer valid (410 Gone or 404), mark for cleanup
                if (error.statusCode === 410 || error.statusCode === 404) {
                    failedSubscriptionIds.push(sub.id);
                }
            }
        }

        // Cleanup invalid subscriptions
        if (failedSubscriptionIds.length > 0) {
            await pool.query(
                'DELETE FROM tb_subscriptions WHERE id = ANY($1)',
                [failedSubscriptionIds]
            );
            console.log(`🧹 Cleaned up ${failedSubscriptionIds.length} invalid subscription(s)`);
        }

        return { sent, failed };

    } catch (error) {
        console.error('Send targeted notification error:', error);
        return { sent: 0, failed: 0, error: error.message };
    }
};

/**
 * Get VAPID Public Key
 * GET /notifications/vapid-public-key
 * Used by frontend to subscribe to push notifications
 */
const getVapidPublicKey = (req, res) => {
    res.json({
        success: true,
        publicKey: process.env.VAPID_PUBLIC_KEY || ''
    });
};

module.exports = {
    saveSubscription,
    sendTargetedNotification,
    getVapidPublicKey
};
