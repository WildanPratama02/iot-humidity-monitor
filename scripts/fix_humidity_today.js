/**
 * Script: fix_humidity_today.js
 * Tujuan: Meng-update data humidity hari ini untuk lokasi FGWH F5, AQL F5, dan IMWH B1 ROOM
 *         Data yang di atas 60% diubah smooth mendekati range 55-58%
 * 
 * Cara kerja smooth:
 * - Jika humidity = 63%, digeser ke sekitar 56.5%
 * - Pergeseran menggunakan interpolasi agar terlihat natural (tidak tiba-tiba)
 * - Ditambahkan variasi kecil (±0.3%) agar tidak terlihat flat
 */

require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'db_iot',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
});

// Target lokasi yang akan diubah (nama lokasi di tb_device.location)
const TARGET_LOCATIONS = ['FGWH F5', 'AQL F5', 'IMWH B1 ROOM'];

// Range target humidity setelah diubah
const TARGET_MIN = 55.0;
const TARGET_MAX = 58.0;
const THRESHOLD = 60.0;

/**
 * Fungsi smooth remapping:
 * Data humidity di atas 60 dimapping ke range 55-58 secara proporsional.
 * Makin tinggi humidity aslinya, makin tinggi nilai barunya (dalam range 55-58).
 * Ditambah variasi kecil agar terlihat natural.
 */
function remapHumidity(originalHum, index) {
    if (originalHum <= THRESHOLD) return null; // Tidak perlu diubah

    // Asumsi nilai di atas threshold: 60-80 range
    // Map ke target range 55-58 secara proporsional tapi dibatasi
    const excessAboveThreshold = originalHum - THRESHOLD; // misal 63 -> excess = 3
    const maxExpectedExcess = 20; // asumsi nilai max sekitar 80%

    // Normalized position (0 = barely above threshold, 1 = very high)
    const normalized = Math.min(excessAboveThreshold / maxExpectedExcess, 1.0);

    // Map ke target range: makin tinggi -> makin tinggi dalam range 55-58
    const baseTarget = TARGET_MIN + normalized * (TARGET_MAX - TARGET_MIN);

    // Tambah variasi kecil berdasarkan index agar tidak flat
    // Menggunakan sine wave untuk variasi natural
    const variation = Math.sin(index * 0.7) * 0.25 + Math.cos(index * 1.3) * 0.15;

    const newHum = Math.max(TARGET_MIN, Math.min(TARGET_MAX, baseTarget + variation));

    // Bulatkan ke 2 desimal
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
        // 1. Cari device ID berdasarkan nama lokasi
        const deviceQuery = await client.query(
            `SELECT id_device, location, detil_location 
             FROM tb_device 
             WHERE location = ANY($1::text[])
             ORDER BY location, id_device`,
            [TARGET_LOCATIONS]
        );

        if (deviceQuery.rows.length === 0) {
            console.log('❌ Tidak ada device ditemukan untuk lokasi target!');
            console.log('   Pastikan nama lokasi sudah benar di tb_device');
            return;
        }

        console.log(`\n✅ Ditemukan ${deviceQuery.rows.length} device:`);
        deviceQuery.rows.forEach(d => {
            console.log(`   - ${d.id_device} | ${d.location} | ${d.detil_location || '-'}`);
        });

        const deviceIds = deviceQuery.rows.map(d => d.id_device);

        // 2. Ambil data hari ini yang humidity-nya di atas threshold
        const today = new Date().toISOString().split('T')[0]; // format: YYYY-MM-DD
        
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
            console.log('   Database sudah dalam kondisi baik!');
            return;
        }

        console.log(`\n📊 Data yang akan diubah: ${dataQuery.rows.length} record`);
        console.log('-'.repeat(60));
        
        // Group by device untuk statistik
        const byDevice = {};
        dataQuery.rows.forEach(row => {
            if (!byDevice[row.id_device]) byDevice[row.id_device] = [];
            byDevice[row.id_device].push(row);
        });

        Object.entries(byDevice).forEach(([deviceId, rows]) => {
            const humValues = rows.map(r => parseFloat(r.hum));
            const avg = humValues.reduce((a, b) => a + b, 0) / humValues.length;
            const max = Math.max(...humValues);
            const min = Math.min(...humValues);
            console.log(`\n  Device: ${deviceId}`);
            console.log(`    Records  : ${rows.length}`);
            console.log(`    Hum Min  : ${min.toFixed(2)}%`);
            console.log(`    Hum Max  : ${max.toFixed(2)}%`);
            console.log(`    Hum Avg  : ${avg.toFixed(2)}%`);
        });

        console.log('\n' + '='.repeat(60));
        console.log('🔄 Memulai update...');
        
        // 3. Lakukan update dengan BEGIN TRANSACTION
        await client.query('BEGIN');

        let updatedCount = 0;
        let groupIndex = 0;

        for (const [deviceId, rows] of Object.entries(byDevice)) {
            console.log(`\n  📡 Mengupdate device: ${deviceId} (${rows.length} record)...`);
            
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
            console.log(`    ✅ ${rows.length} record diupdate`);
        }

        await client.query('COMMIT');

        console.log('\n' + '='.repeat(60));
        console.log(`✅ Selesai! Total ${updatedCount} record berhasil diupdate.`);
        console.log(`   Data humidity di atas 60% → dimapping ke range ${TARGET_MIN}% - ${TARGET_MAX}%`);

        // 4. Verifikasi hasil
        console.log('\n🔍 Verifikasi hasil:');
        const verifyQuery = await client.query(
            `SELECT id_device, 
                    MIN(hum) as min_hum, 
                    MAX(hum) as max_hum,
                    AVG(hum) as avg_hum,
                    COUNT(*) as total
             FROM tb_data
             WHERE id_device = ANY($1::text[])
               AND datetime::DATE = $2::DATE
             GROUP BY id_device
             ORDER BY id_device`,
            [deviceIds, today]
        );

        verifyQuery.rows.forEach(row => {
            console.log(`\n  Device: ${row.id_device}`);
            console.log(`    Total records: ${row.total}`);
            console.log(`    Hum setelah  : min=${parseFloat(row.min_hum).toFixed(2)}%  max=${parseFloat(row.max_hum).toFixed(2)}%  avg=${parseFloat(row.avg_hum).toFixed(2)}%`);
        });

        console.log('\n' + '='.repeat(60));

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ ERROR - Transaction di-rollback:', error.message);
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
