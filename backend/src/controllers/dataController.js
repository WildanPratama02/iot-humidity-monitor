/**
 * Data Controller
 * Handles sensor data CRUD operations with integrated alert logic
 */
const pool = require('../config/database');
const { sendTargetedNotification } = require('./notificationController');

// Alert thresholds
const TEMP_THRESHOLD = 25; // °C
const HUM_THRESHOLD = 60;  // %

/**
 * Insert Sensor Data
 * POST /data
 * Body: { id_device, temp, hum }
 * Triggers targeted notification if threshold exceeded
 */
const insertData = async (req, res) => {
    try {
        const { id_device, temp, hum } = req.body;

        if (!id_device || temp === undefined || hum === undefined) {
            return res.status(400).json({
                success: false,
                message: 'id_device, temp, dan hum harus diisi'
            });
        }

        // Insert sensor data
        const result = await pool.query(
            `INSERT INTO tb_data (id_device, temp, hum, datetime)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
             RETURNING id, id_device, temp, hum, datetime`,
            [id_device, temp, hum]
        );

        const insertedData = result.rows[0];

        // Check if threshold exceeded
        const isTempDanger = temp > TEMP_THRESHOLD;
        const isHumDanger = hum > HUM_THRESHOLD;

        if (isTempDanger || isHumDanger) {
            // Get device location
            const deviceResult = await pool.query(
                'SELECT location FROM tb_device WHERE id_device = $1',
                [id_device]
            );

            if (deviceResult.rows.length > 0) {
                const location = deviceResult.rows[0].location;

                // Build alert message
                let alertType = '';
                let alertValue = '';

                if (isTempDanger && isHumDanger) {
                    alertType = 'Suhu & Kelembaban Tinggi';
                    alertValue = `${temp.toFixed(1)}°C / ${hum.toFixed(1)}%`;
                } else if (isTempDanger) {
                    alertType = 'Suhu Tinggi';
                    alertValue = `${temp.toFixed(1)}°C`;
                } else {
                    alertType = 'Kelembaban Tinggi';
                    alertValue = `${hum.toFixed(1)}%`;
                }

                // Send targeted notification to PIC of this location
                const notificationResult = await sendTargetedNotification(location, {
                    title: `⚠️ ALERT: ${location}`,
                    body: `${alertType} (${alertValue})!`,
                    deviceId: id_device,
                    temp,
                    hum
                });

                console.log(`📊 Alert sent for ${location}: ${notificationResult.sent} delivered, ${notificationResult.failed} failed`);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Data berhasil disimpan',
            data: insertedData
        });

    } catch (error) {
        console.error('Insert data error:', error.message);
        console.error('Full error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: process.env.NODE_ENV !== 'production' ? error.message : undefined
        });
    }
};

/**
 * Get Sensor Data by Device
 * GET /data/:deviceId
 * Query params:
 *   - start_date: ISO date string (e.g., '2024-01-01')
 *   - end_date: ISO date string (e.g., '2024-01-31')
 *   - limit: number of records (default 1440, ignored if date range provided)
 * Returns sensor history for a specific device
 */
const getDataByDevice = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { start_date, end_date } = req.query;
        const limit = parseInt(req.query.limit) || 1440;

        let result;

        // If date range is provided, filter by date
        if (start_date && end_date) {
            console.log(`[Export Debug] Device: ${deviceId}, Start: ${start_date}, End: ${end_date}`);

            // Use DATE casting for proper date-only comparison
            result = await pool.query(
                `SELECT id, id_device, temp, hum, datetime
                 FROM tb_data
                 WHERE id_device = $1
                   AND datetime::DATE >= $2::DATE
                   AND datetime::DATE <= $3::DATE
                 ORDER BY datetime DESC`,
                [deviceId, start_date, end_date]
            );

            console.log(`[Export Debug] Found ${result.rows.length} records`);
        } else {
            // Fall back to limit-based query
            result = await pool.query(
                `SELECT id, id_device, temp, hum, datetime
                 FROM tb_data
                 WHERE id_device = $1
                 ORDER BY datetime DESC
                 LIMIT $2`,
                [deviceId, limit]
            );
        }

        res.json(result.rows);

    } catch (error) {
        console.error('Get data error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

/**
 * Get All Devices
 * GET /devices
 */
const getAllDevices = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id_device, location, detil_location, mac_address FROM tb_device WHERE id_device != 'B1MT01' ORDER BY location"
        );

        res.json(result.rows);

    } catch (error) {
        console.error('Get devices error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

/**
 * Get All Locations
 * GET /locations
 * Returns distinct locations from devices
 */
const getAllLocations = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT DISTINCT location FROM tb_device WHERE id_device != 'B1MT01' ORDER BY location"
        );

        res.json({
            success: true,
            locations: result.rows.map(r => r.location)
        });

    } catch (error) {
        console.error('Get locations error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

module.exports = {
    insertData,
    getDataByDevice,
    getAllDevices,
    getAllLocations
};
