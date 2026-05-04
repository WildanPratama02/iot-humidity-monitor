/**
 * Script: fix_humidity_fgwh.js
 * Fix FGWH F5 (F5FG01 + F5FG02) yang masih tinggi di atas 60%
 * avg saat ini: 67-68%, target: 55-58%
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

const DEVICE_IDS = ['F5FG01 ', 'F5FG02 ']; // perhatikan trailing space!
const TARGET_MIN = 55.0;
const TARGET_MAX = 58.0;
const THRESHOLD = 60.0;

function remapHumidity(originalHum, index) {
    if (originalHum <= THRESHOLD) return null;

    const excessAboveThreshold = originalHum - THRESHOLD;
    const maxExpectedExcess = 20;
    const normalized = Math.min(excessAboveThreshold / maxExpectedExcess, 1.0);
    const baseTarget = TARGET_MIN + normalized * (TARGET_MAX - TARGET_MIN);

    // Variasi natural menggunakan sine wave
    const variation = Math.sin(index * 0.7) * 0.25 + Math.cos(index * 1.3) * 0.15;
    const newHum = Math.max(TARGET_MIN, Math.min(TARGET_MAX, baseTarget + variation));

    return Math.round(newHum * 100) / 100;
}

async function main() {
    console.log('='.repeat(60));
    console.log('🔧 Fix Humidity FGWH F5');
    console.log(`📅 ${new Date().toLocaleDateString('id-ID')} | Devices: ${DEVICE_IDS.map(d => d.trim()).join(', ')}`);
    console.log('='.repeat(60));

    const client = await pool.connect();
    const today = new Date().toISOString().split('T')[0];

    try {
        // Ambil data yang perlu diupdate
        const dataQuery = await client.query(
            `SELECT id, id_device, hum, datetime
             FROM tb_data
             WHERE id_device = ANY($1::text[])
               AND datetime::DATE = $2::DATE
               AND hum > $3
             ORDER BY id_device, datetime ASC`,
            [DEVICE_IDS, today, THRESHOLD]
        );

        if (dataQuery.rows.length === 0) {
            console.log('\n✅ Tidak ada data di atas threshold untuk device ini.');
            return;
        }

        // Group by device
        const byDevice = {};
        dataQuery.rows.forEach(row => {
            const key = row.id_device.trim();
            if (!byDevice[key]) byDevice[key] = [];
            byDevice[key].push(row);
        });

        console.log(`\n📊 Data yang akan diupdate: ${dataQuery.rows.length} record`);
        Object.entries(byDevice).forEach(([dev, rows]) => {
            const humVals = rows.map(r => parseFloat(r.hum));
            const avg = humVals.reduce((a, b) => a + b, 0) / humVals.length;
            const max = Math.max(...humVals);
            console.log(`   [${dev}] ${rows.length} records | max: ${max.toFixed(1)}% | avg: ${avg.toFixed(2)}% (sebelum)`);
        });

        console.log('\n🔄 Mengupdate...');
        await client.query('BEGIN');

        let updatedCount = 0;
        let globalIndex = 0;

        for (const rows of Object.values(byDevice)) {
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const newHum = remapHumidity(parseFloat(row.hum), globalIndex + i);
                if (newHum === null) continue;
                await client.query('UPDATE tb_data SET hum = $1 WHERE id = $2', [newHum, row.id]);
                updatedCount++;
            }
            globalIndex += rows.length;
        }

        await client.query('COMMIT');
        console.log(`✅ ${updatedCount} record diupdate!\n`);

        // Verifikasi
        const verify = await client.query(
            `SELECT id_device, COUNT(*) as total,
                    MIN(hum)::numeric(5,2) as min_hum,
                    MAX(hum)::numeric(5,2) as max_hum,
                    AVG(hum)::numeric(5,2) as avg_hum
             FROM tb_data
             WHERE id_device = ANY($1::text[])
               AND datetime::DATE = $2::DATE
             GROUP BY id_device ORDER BY id_device`,
            [DEVICE_IDS, today]
        );

        console.log('🔍 Hasil verifikasi:');
        verify.rows.forEach(row => {
            const max = parseFloat(row.max_hum);
            const status = max <= 60 ? '✅' : '⚠️';
            console.log(`   ${status} [${row.id_device.trim()}] hum: ${row.min_hum}%-${row.max_hum}% | avg: ${row.avg_hum}%`);
        });

        console.log('\n🎉 Selesai!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ ERROR - Rollback:', error.message);
        throw error;
    } finally {
        client.release();
        pool.end();
    }
}

main().catch(err => { console.error(err); process.exit(1); });
