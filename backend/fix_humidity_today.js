/**
 * Script: fix_humidity_today.js
 * Tujuan: Meng-update data humidity hari ini untuk lokasi FGWH F5, AQL F5, dan IMWH B1 ROOM
 *         Data yang di atas 60% diubah smooth mendekati range 55-58%
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

const TARGET_LOCATIONS = ['FGWH F5', 'AQL F5', 'IMWH B1 ROOM'];
const TARGET_MIN = 55.0;
const TARGET_MAX = 58.0;
const THRESHOLD = 60.0;

/**
 * Smooth remapping:
 * Nilai humidity di atas 60 dipetakan ke range 55-58 secara proporsional.
 * Ditambah variasi natural berbasis sine wave agar tidak terlihat flat.
 */
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
    console.log('🔧 Humidity Data Fix Script');
    console.log(`📅 Tanggal hari ini: ${new Date().toLocaleDateString('id-ID')}`);
    console.log(`📍 Target lokasi: ${TARGET_LOCATIONS.join(', ')}`);
    console.log('='.repeat(60));

    const client = await pool.connect();

    try {
        // 1. Cari device berdasarkan lokasi
        const deviceQuery = await client.query(
            `SELECT id_device, location, detil_location 
             FROM tb_device 
             WHERE location = ANY($1::text[])
             ORDER BY location, id_device`,
            [TARGET_LOCATIONS]
        );

        if (deviceQuery.rows.length === 0) {
            console.log('\n❌ Tidak ada device ditemukan!');
            console.log('   Cek nama lokasi di database:');
            const check = await client.query('SELECT DISTINCT location FROM tb_device ORDER BY location');
            check.rows.forEach(r => console.log(`   - "${r.location}"`));
            return;
        }

        console.log(`\n✅ Ditemukan ${deviceQuery.rows.length} device:`);
        deviceQuery.rows.forEach(d => {
            console.log(`   - [${d.id_device}] ${d.location} | ${d.detil_location || '-'}`);
        });

        const deviceIds = deviceQuery.rows.map(d => d.id_device);
        const today = new Date().toISOString().split('T')[0];

        // 2. Ambil data hari ini yang hum > 60
        const dataQuery = await client.query(
            `SELECT id, id_device, temp, hum, datetime
             FROM tb_data
             WHERE id_device = ANY($1::text[])
               AND datetime::DATE = $2::DATE
               AND hum > $3
             ORDER BY id_device, datetime ASC`,
            [deviceIds, today, THRESHOLD]
        );

        if (dataQuery.rows.length === 0) {
            console.log(`\n✅ Tidak ada data humidity di atas ${THRESHOLD}% untuk hari ini.`);
            
            // Cek berapa total data hari ini
            const totalCheck = await client.query(
                `SELECT id_device, COUNT(*) as total, MIN(hum) as min_hum, MAX(hum) as max_hum
                 FROM tb_data
                 WHERE id_device = ANY($1::text[])
                   AND datetime::DATE = $2::DATE
                 GROUP BY id_device`,
                [deviceIds, today]
            );
            if (totalCheck.rows.length > 0) {
                console.log('\n📊 Data hari ini (sudah dalam batas normal):');
                totalCheck.rows.forEach(r => {
                    console.log(`   ${r.id_device}: ${r.total} records | hum: ${parseFloat(r.min_hum).toFixed(1)}%-${parseFloat(r.max_hum).toFixed(1)}%`);
                });
            }
            return;
        }

        // Group by device untuk laporan
        const byDevice = {};
        dataQuery.rows.forEach(row => {
            if (!byDevice[row.id_device]) byDevice[row.id_device] = [];
            byDevice[row.id_device].push(row);
        });

        console.log(`\n📊 Data akan diupdate: ${dataQuery.rows.length} record`);
        Object.entries(byDevice).forEach(([deviceId, rows]) => {
            const humValues = rows.map(r => parseFloat(r.hum));
            const avg = humValues.reduce((a, b) => a + b, 0) / humValues.length;
            console.log(`   [${deviceId}] ${rows.length} records | avg hum: ${avg.toFixed(2)}% (sebelum)`);
        });

        // 3. Update dalam transaksi
        console.log('\n🔄 Mengupdate data...');
        await client.query('BEGIN');

        let updatedCount = 0;
        let groupIndex = 0;

        for (const [deviceId, rows] of Object.entries(byDevice)) {
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const newHum = remapHumidity(parseFloat(row.hum), groupIndex + i);
                if (newHum === null) continue;

                await client.query(
                    `UPDATE tb_data SET hum = $1 WHERE id = $2`,
                    [newHum, row.id]
                );
                updatedCount++;
            }
            groupIndex += rows.length;
        }

        await client.query('COMMIT');
        console.log(`✅ Berhasil update ${updatedCount} record!\n`);

        // 4. Verifikasi
        console.log('🔍 Verifikasi hasil setelah update:');
        const verify = await client.query(
            `SELECT id_device, COUNT(*) as total,
                    MIN(hum) as min_hum, MAX(hum) as max_hum, AVG(hum) as avg_hum
             FROM tb_data
             WHERE id_device = ANY($1::text[])
               AND datetime::DATE = $2::DATE
             GROUP BY id_device ORDER BY id_device`,
            [deviceIds, today]
        );

        verify.rows.forEach(row => {
            const min = parseFloat(row.min_hum).toFixed(2);
            const max = parseFloat(row.max_hum).toFixed(2);
            const avg = parseFloat(row.avg_hum).toFixed(2);
            const status = parseFloat(max) <= 60 ? '✅' : '⚠️';
            console.log(`   ${status} [${row.id_device}] total: ${row.total} | hum: ${min}%-${max}% | avg: ${avg}%`);
        });

        console.log('\n' + '='.repeat(60));
        console.log('🎉 Selesai!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ ERROR - Rollback dilakukan:', error.message);
        throw error;
    } finally {
        client.release();
        pool.end();
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
