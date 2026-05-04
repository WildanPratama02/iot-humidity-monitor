/**
 * Authentication Controller
 * Handles user login, registration, and token management
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const SALT_ROUNDS = 10;

/**
 * User Login
 * POST /auth/login
 * Body: { username, password }
 * Returns: { token, user: { id, username, role, assignedLocation } }
 */
const login = async (req, res) => {
    try {
        const { username, password: encodedPassword } = req.body;

        // Validate input
        if (!username || !encodedPassword) {
            return res.status(400).json({
                success: false,
                message: 'Username dan password harus diisi'
            });
        }

        // Decode password from Base64
        const password = Buffer.from(encodedPassword, 'base64').toString('utf-8');

        // Find user by username
        const result = await pool.query(
            'SELECT id, username, password, role, assigned_location FROM tb_users WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            });
        }

        const user = result.rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            });
        }

        // Generate JWT token
        const tokenPayload = {
            userId: user.id,
            username: user.username,
            role: user.role,
            assignedLocation: user.assigned_location
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        // Update last login timestamp (optional)
        await pool.query(
            'UPDATE tb_users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        res.json({
            success: true,
            message: 'Login berhasil',
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                assignedLocation: user.assigned_location
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

/**
 * Register New User (Admin Only)
 * POST /users
 * Body: { username, password, role, assignedLocation }
 * Headers: Authorization: Bearer <token>
 */
const register = async (req, res) => {
    try {
        const { username, password, role, assignedLocation } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username dan password harus diisi'
            });
        }

        // Validate role
        if (role && !['admin', 'pic'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Role harus admin atau pic'
            });
        }

        // For PIC role, assigned_location is required
        if (role === 'pic' && !assignedLocation) {
            return res.status(400).json({
                success: false,
                message: 'PIC harus memiliki assigned location'
            });
        }

        // Check if username already exists
        const existingUser = await pool.query(
            'SELECT id FROM tb_users WHERE username = $1',
            [username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Username sudah digunakan'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Insert new user
        const result = await pool.query(
            `INSERT INTO tb_users (username, password, role, assigned_location)
             VALUES ($1, $2, $3, $4)
             RETURNING id, username, role, assigned_location, created_at`,
            [username, hashedPassword, role || 'pic', role === 'admin' ? null : assignedLocation]
        );

        const newUser = result.rows[0];

        res.status(201).json({
            success: true,
            message: 'User berhasil dibuat',
            user: {
                id: newUser.id,
                username: newUser.username,
                role: newUser.role,
                assignedLocation: newUser.assigned_location,
                createdAt: newUser.created_at
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

/**
 * Get All Users (Admin Only)
 * GET /users
 * Headers: Authorization: Bearer <token>
 */
const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, username, role, assigned_location, created_at, updated_at 
             FROM tb_users 
             ORDER BY created_at DESC`
        );

        res.json({
            success: true,
            users: result.rows.map(user => ({
                id: user.id,
                username: user.username,
                role: user.role,
                assignedLocation: user.assigned_location,
                createdAt: user.created_at,
                updatedAt: user.updated_at
            }))
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

/**
 * Delete User (Admin Only)
 * DELETE /users/:id
 * Headers: Authorization: Bearer <token>
 */
const deleteUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const currentUserId = req.user.userId;

        // Prevent self-deletion
        if (userId === currentUserId) {
            return res.status(400).json({
                success: false,
                message: 'Tidak dapat menghapus akun sendiri'
            });
        }

        const result = await pool.query(
            'DELETE FROM tb_users WHERE id = $1 RETURNING id, username',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        res.json({
            success: true,
            message: `User ${result.rows[0].username} berhasil dihapus`
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

/**
 * Get Current User Profile
 * GET /auth/me
 * Headers: Authorization: Bearer <token>
 */
const getCurrentUser = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, role, assigned_location FROM tb_users WHERE id = $1',
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        const user = result.rows[0];
        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                assignedLocation: user.assigned_location
            }
        });

    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

module.exports = {
    login,
    register,
    getAllUsers,
    deleteUser,
    getCurrentUser
};
