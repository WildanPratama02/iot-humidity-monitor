-- ==========================================================
-- Migration: Add composite index for device last_seen queries
-- Optimizes GET /admin/devices and /data/:deviceId lookups
-- ==========================================================

CREATE INDEX IF NOT EXISTS idx_tb_data_id_device_datetime 
ON public.tb_data (id_device, datetime DESC);
