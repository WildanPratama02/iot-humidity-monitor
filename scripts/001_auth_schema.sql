-- ============================================
-- IoT Humidity Monitor - Authentication & RBAC
-- Database Migration Script
-- ============================================

-- 1. Create tb_users table for authentication and RBAC
CREATE TABLE IF NOT EXISTS tb_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Stored as bcrypt hash
    role VARCHAR(10) NOT NULL DEFAULT 'pic' CHECK (role IN ('admin', 'pic')),
    assigned_location VARCHAR(100), -- NULL for admin, matches tb_device.location for PIC
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create index for faster login queries
CREATE INDEX IF NOT EXISTS idx_users_username ON tb_users(username);
CREATE INDEX IF NOT EXISTS idx_users_assigned_location ON tb_users(assigned_location);

-- 3. Create tb_subscriptions table for Web Push notifications
CREATE TABLE IF NOT EXISTS tb_subscriptions (
    id SERIAL PRIMARY KEY,
    endpoint TEXT UNIQUE NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_id INTEGER REFERENCES tb_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create index for faster subscription lookups by user
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON tb_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_endpoint ON tb_subscriptions(endpoint);

-- 5. Create default admin user
-- Password: admin123 (Change this immediately after first login!)
INSERT INTO tb_users (username, password, role, assigned_location)
VALUES ('admin', '$2b$10$rHpJz1nKzKW9pVxvJJ2vXO7rZoGq8d1R5E6mN3pM4bL2xK9aWkDmS', 'admin', NULL)
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- Example: Create PIC users for specific locations
-- ============================================
-- INSERT INTO tb_users (username, password, role, assigned_location)
-- VALUES 
--     ('pic_factory1', '$2b$10$HASHED_PASSWORD', 'pic', 'FACTORY 1'),
--     ('pic_factory2', '$2b$10$HASHED_PASSWORD', 'pic', 'FACTORY 2'),
--     ('pic_fgwh', '$2b$10$HASHED_PASSWORD', 'pic', 'FGWH F1&2');
