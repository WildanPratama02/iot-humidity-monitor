/**
 * Device Controller
 * Handles CRUD operations for devices
 */
const pool = require('../config/database');

/**
 * Get All Devices
 * GET /admin/devices
 */
const getAllDevices = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM tb_device ORDER BY location"
        );
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get all devices error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

/**
 * Create Device
 * POST /admin/devices
 */
const createDevice = async (req, res) => {
    try {
        const { id_device, location, detil_location, mac_address } = req.body;

        if (!id_device || !location) {
            return res.status(400).json({
                success: false,
                message: 'ID Device dan Lokasi wajib diisi'
            });
        }

        // Check if device ID already exists
        const check = await pool.query('SELECT id_device FROM tb_device WHERE id_device = $1', [id_device]);
        if (check.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'ID Device sudah terdaftar'
            });
        }

        const result = await pool.query(
            `INSERT INTO tb_device (id_device, location, detil_location, mac_address) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [id_device, location, detil_location, mac_address]
        );

        res.status(201).json({
            success: true,
            message: 'Device berhasil ditambahkan',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Create device error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

/**
 * Update Device
 * PUT /admin/devices/:id
 */
const updateDevice = async (req, res) => {
    try {
        const { id } = req.params; // NOTE: id here refers to id_device based on typical REST usage, but let's check if there is a serial ID. 
        // Based on previous files, id_device seems to be the main identifier (string usually).
        // However, standard REST usually puts the ID in the URL.
        // Let's assume id param IS the id_device.

        const { location, detil_location, mac_address } = req.body;

        const result = await pool.query(
            `UPDATE tb_device 
             SET location = $1, detil_location = $2, mac_address = $3
             WHERE id_device = $4
             RETURNING *`,
            [location, detil_location, mac_address, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Device tidak ditemukan'
            });
        }

        res.json({
            success: true,
            message: 'Device berhasil diupdate',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Update device error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

/**
 * Delete Device
 * DELETE /admin/devices/:id
 */
const deleteDevice = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM tb_device WHERE id_device = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Device tidak ditemukan'
            });
        }

        res.json({
            success: true,
            message: 'Device berhasil dihapus'
        });

    } catch (error) {
        console.error('Delete device error:', error);
        // Check for foreign key constraint violation
        if (error.code === '23503') { 
            return res.status(400).json({
                success: false,
                message: 'Device tidak bisa dihapus karena masih memiliki data history sensor'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

module.exports = {
    getAllDevices,
    createDevice,
    updateDevice,
    deleteDevice
};
