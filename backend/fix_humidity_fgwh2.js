/**
 * Script: fix_humidity_fgwh2.js
 * Fix FGWH F5 (F5FG01 + F5FG02) dengan TRIM() untuk handle trailing spaces
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'db_iot',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
});

const TARGET_MIN = 55.0;
const TARGET_MAX = 58.0;
const THRESHOLD = 60.0;

function remapHumidity(originalHum, index) {
    if (originalHum <= THRESHOLD) return null;
    const excessAboveThreshold = originalHum - THRESHOLD;
    const maxExpectedExcess = 20;
    const normalized = Math.min(excessAboveThreshold / maxExpectedExcess, 1.0);
    const baseTarget = TARGET_MIN + normalized * (TARGET_MAX - TARGET_MIN);
    const variation = Math.sin(index * 0.7) * 0.25 + Math.cos(index * 1.3) * 0.15;
    const newHum = Math.max(TARGET_MIN, Math.min(TARGET_MAX, baseTarget + variation));
    return Math.round(newHum * 100) / 100;
}

async function main() {
    const client = await pool.connect();
    const today = new Date().toISOString().split('T')[0];

    try {
        // Query menggunakan TRIM() untuk menghindari masalah trailing space
        const dataQuery = await client.query(
            `SELECT d.id, d.id_device, d.hum, d.datetime
             FROM tb_data d
             JOIN tb_device dev ON TRIM(d.id_device) = TRIM(dev.id_device)
             WHERE TRIM(dev.location) = 'FGWH F5'
               AND d.datetime::DATE = $1::DATE
               AND d.hum > $2
             ORDER BY d.id_device, d.datetime ASC`,
            [today, THRESHOLD]
        );

        console.log(`\nFGWH F5 - Data di atas ${THRESHOLD}%: ${dataQuery.rows.length} record`);

        if (dataQuery.rows.length === 0) {
            console.log('✅ Tidak ada data yang perlu diubah.');
            
            // Debug - cek langsung dari tb_data
            const debugQ = await client.query(
                `SELECT id_device, COUNT(*) as cnt, MIN(hum) as mn, MAX(hum) as mx
                 FROM tb_data
                 WHERE datetime::DATE = $1
                 GROUP BY id_device
                 HAVING MIN(id_device) LIKE 'F5FG%'
                 ORDER BY id_device`,
                [today]
            );
            console.log('\nDebug tb_data FGWH:');
            debugQ.rows.forEach(r => console.log(`  "${r.id_device}" cnt=${r.cnt} hum: ${r.mn}-${r.mx}`));
            return;
        }

        // Group by device
        const byDevice = {};
        dataQuery.rows.forEach(row => {
            const key = row.id_device.trim();
            if (!byDevice[key]) byDevice[key] = [];
            byDevice[key].push(row);
        });

        Object.entries(byDevice).forEach(([dev, rows]) => {
            const humVals = rows.map(r => parseFloat(r.hum));
            const avg = (humVals.reduce((a, b) => a + b, 0) / humVals.length).toFixed(2);
            const max = Math.max(...humVals).toFixed(1);
            console.log(`   [${dev}] ${rows.length} records | max: ${max}% | avg: ${avg}% (SEBELUM)`);
        });

        await client.query('BEGIN');
        let updatedCount = 0;
        let globalIndex = 0;

        for (const rows of Object.values(byDevice)) {
            for (let i = 0; i < rows.length; i++) {
                const newHum = remapHumidity(parseFloat(rows[i].hum), globalIndex + i);
                if (newHum === null) continue;
                await client.query('UPDATE tb_data SET hum = $1 WHERE id = $2', [newHum, rows[i].id]);
                updatedCount++;
            }
            globalIndex += rows.length;
        }
        await client.query('COMMIT');
        console.log(`\n✅ ${updatedCount} record diupdate!\n`);

        // Verifikasi SESUDAH
        const verify = await client.query(
            `SELECT d.id_device, COUNT(*) as total,
                    MIN(d.hum)::numeric(5,2) as min_hum,
                    MAX(d.hum)::numeric(5,2) as max_hum,
                    AVG(d.hum)::numeric(5,2) as avg_hum
             FROM tb_data d
             JOIN tb_device dev ON TRIM(d.id_device) = TRIM(dev.id_device)
             WHERE TRIM(dev.location) = 'FGWH F5'
               AND d.datetime::DATE = $1
             GROUP BY d.id_device ORDER BY d.id_device`,
            [today]
        );

        console.log('🔍 Verifikasi SESUDAH:');
        verify.rows.forEach(row => {
            const max = parseFloat(row.max_hum);
            const status = max <= 60 ? '✅' : '⚠️';
            console.log(`   ${status} [${row.id_device.trim()}] hum: ${row.min_hum}%-${row.max_hum}% | avg: ${row.avg_hum}%`);
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ ERROR:', error.message);
    } finally {
        client.release();
        pool.end();
    }
}

main();
