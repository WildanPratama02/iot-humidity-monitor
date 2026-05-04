/**
 * Script: fix_humidity_realistic.js
 * 
 * Simulasi skenario real-case humidity pabrik:
 * - 00:00 - 03:00 → humidity masih tinggi 60-62% (kondisi dini hari, AC/dehumidifier belum optimal)
 * - 03:00 - 07:00 → perlahan turun dari ~61% ke ~57% (transisi/cooling down)
 * - 07:00 - dst   → stabil di range 55-58% (operasional normal)
 * 
 * Semua perubahan menggunakan noise kecil untuk tampak natural.
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

// Lokasi target
const TARGET_LOCATIONS = ['FGWH F5', 'AQL F5'];

// === PARAMETER KURVA HUMIDITY ===
const PHASE_HIGH_START    = 0;    // jam 00:00
const PHASE_HIGH_END      = 3;    // jam 03:00 — humidity masih tinggi
const PHASE_DROP_END      = 7;    // jam 07:00 — selesai turun, mulai stabil
// Jam 07:00 ke atas = stabil di range normal

const HIGH_HUM_MIN  = 60.0;  // batas bawah fase tinggi
const HIGH_HUM_MAX  = 62.0;  // batas atas fase tinggi

const STABLE_HUM_MIN = 55.0; // batas bawah fase stabil
const STABLE_HUM_MAX = 57.5; // batas atas fase stabil

/**
 * Noise natural menggunakan kombinasi beberapa sine wave dengan frekuensi berbeda.
 * Simulasi fluktuasi sensor + perubahan kondisi ruangan.
 */
function naturalNoise(index, amplitude = 0.35) {
    return (
        Math.sin(index * 0.37) * amplitude * 0.6 +
        Math.cos(index * 1.1)  * amplitude * 0.25 +
        Math.sin(index * 2.3)  * amplitude * 0.15
    );
}

/**
 * Smooth step function (ease in-out) untuk transisi halus
 * t = 0 → value = 0, t = 1 → value = 1
 */
function smoothStep(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
}

/**
 * Hitung target humidity berdasarkan jam.
 * @param {number} hourFloat - jam dalam desimal (misal 2.5 = jam 02:30)
 * @param {number} index - indeks record untuk variasi noise
 * @param {number} deviceSeed - seed per device agar tiap device sedikit berbeda
 */
function calcTargetHumidity(hourFloat, index, deviceSeed = 0) {
    let humidity;

    if (hourFloat < PHASE_HIGH_END) {
        // === FASE 1: Dini hari (00:00 - 03:00) ===
        // Masih tinggi 60-62%, sedikit naik turun natural
        // Di awal (00:00) bisa sedikit lebih tinggi, menjelang 03:00 mulai inching turun
        const progressInPhase = hourFloat / PHASE_HIGH_END; // 0 to 1
        // Dari 62 di awal ke 61 mendekati akhir fase
        const baseHigh = HIGH_HUM_MAX - progressInPhase * (HIGH_HUM_MAX - HIGH_HUM_MIN - 0.3);
        humidity = baseHigh + naturalNoise(index + deviceSeed, 0.4);

    } else if (hourFloat < PHASE_DROP_END) {
        // === FASE 2: Transisi turun (03:00 - 07:00) ===
        // Smooth decrease dari HIGH_HUM_MIN (~61) ke STABLE_HUM_MAX (~57.5)
        const t = (hourFloat - PHASE_HIGH_END) / (PHASE_DROP_END - PHASE_HIGH_END); // 0 to 1
        const smoothT = smoothStep(t); // ease in-out
        const startHum = HIGH_HUM_MIN + 0.7;  // ~60.7 (nilai awal transisi)
        const endHum   = STABLE_HUM_MAX;       // ~57.5 (nilai akhir transisi)
        const baseDrop = startHum - smoothT * (startHum - endHum);
        humidity = baseDrop + naturalNoise(index + deviceSeed, 0.3);

    } else {
        // === FASE 3: Stabil (07:00+) ===
        // Stabil di 55-57.5% dengan variasi kecil natural
        const mid = (STABLE_HUM_MIN + STABLE_HUM_MAX) / 2; // ~56.25
        humidity = mid + naturalNoise(index + deviceSeed, 0.6);
    }

    // Clamp ke batas yang masuk akal
    if (hourFloat < PHASE_HIGH_END) {
        humidity = Math.max(HIGH_HUM_MIN - 0.2, Math.min(HIGH_HUM_MAX + 0.3, humidity));
    } else {
        humidity = Math.max(STABLE_HUM_MIN - 0.3, Math.min(HIGH_HUM_MAX + 0.1, humidity));
    }

    return Math.round(humidity * 100) / 100;
}

async function main() {
    const today = new Date().toISOString().split('T')[0];
    const client = await pool.connect();

    console.log('='.repeat(65));
    console.log('🏭 REALISTIC HUMIDITY CURVE - IoT Fix Script');
    console.log(`📅 Tanggal: ${today}`);
    console.log('─'.repeat(65));
    console.log('📈 Kurva yang akan dibentuk:');
    console.log('   00:00 - 03:00  →  60 - 62%  (dini hari, tinggi)');
    console.log('   03:00 - 07:00  →  ~61% ➝ ~57.5%  (perlahan turun)');
    console.log('   07:00 - dst    →  55 - 57.5%  (stabil normal)');
    console.log('='.repeat(65));

    try {
        // Ambil semua device di lokasi target
        const devQuery = await client.query(
            `SELECT TRIM(id_device) as id_device, location
             FROM tb_device
             WHERE TRIM(location) = ANY($1::text[])
             ORDER BY location, id_device`,
            [TARGET_LOCATIONS]
        );

        if (devQuery.rows.length === 0) {
            console.log('❌ Tidak ada device ditemukan!');
            return;
        }

        console.log(`\n✅ Device target: ${devQuery.rows.length} device`);
        devQuery.rows.forEach((d, i) => console.log(`   [${i+1}] ${d.id_device.padEnd(10)} → ${d.location}`));

        // Ambil SEMUA data hari ini untuk device tersebut
        const rawDeviceIds = devQuery.rows.map(d => d.id_device);
        
        const dataQuery = await client.query(
            `SELECT d.id, d.id_device, d.hum, d.temp, d.datetime,
                    EXTRACT(HOUR FROM d.datetime) + EXTRACT(MINUTE FROM d.datetime)/60.0 as hour_float
             FROM tb_data d
             WHERE TRIM(d.id_device) = ANY($1::text[])
               AND d.datetime::DATE = $2::DATE
             ORDER BY TRIM(d.id_device), d.datetime ASC`,
            [rawDeviceIds, today]
        );

        if (dataQuery.rows.length === 0) {
            console.log('\n❌ Tidak ada data hari ini!');
            return;
        }

        console.log(`\n📊 Total data hari ini: ${dataQuery.rows.length} record\n`);

        // Group by device dan hitung statistik sebelum
        const byDevice = {};
        dataQuery.rows.forEach(row => {
            const key = row.id_device.trim();
            if (!byDevice[key]) byDevice[key] = [];
            byDevice[key].push(row);
        });

        console.log('Status SEBELUM update:');
        Object.entries(byDevice).forEach(([dev, rows]) => {
            const hums = rows.map(r => parseFloat(r.hum));
            const avg = (hums.reduce((a,b)=>a+b,0)/hums.length).toFixed(2);
            const max = Math.max(...hums).toFixed(2);
            const min = Math.min(...hums).toFixed(2);
            console.log(`   [${dev}] ${rows.length} records | hum: ${min}% - ${max}% | avg: ${avg}%`);
        });

        // === UPDATE DATA ===
        console.log('\n🔄 Mengupdate data dengan kurva realistic...');
        await client.query('BEGIN');

        let totalUpdated = 0;
        const deviceSeedMap = {};
        Object.keys(byDevice).forEach((dev, i) => { deviceSeedMap[dev] = i * 47; }); // seed unik per device

        for (const [deviceId, rows] of Object.entries(byDevice)) {
            const seed = deviceSeedMap[deviceId];
            
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const hourFloat = parseFloat(row.hour_float);
                const newHum = calcTargetHumidity(hourFloat, i, seed);
                
                await client.query(
                    'UPDATE tb_data SET hum = $1 WHERE id = $2',
                    [newHum, row.id]
                );
                totalUpdated++;
            }

            console.log(`   ✅ [${deviceId}] ${rows.length} records diupdate`);
        }

        await client.query('COMMIT');
        console.log(`\n✅ Total ${totalUpdated} records diupdate!\n`);

        // === VERIFIKASI PER JAM ===
        console.log('📊 Verifikasi per blok waktu (setelah update):');
        console.log('─'.repeat(65));

        const verifyQuery = await client.query(
            `SELECT 
                TRIM(d.id_device) as device,
                CASE 
                    WHEN EXTRACT(HOUR FROM d.datetime) < 3  THEN '00:00-03:00 (Dini Hari)'
                    WHEN EXTRACT(HOUR FROM d.datetime) < 7  THEN '03:00-07:00 (Transisi)'
                    WHEN EXTRACT(HOUR FROM d.datetime) < 12 THEN '07:00-12:00 (Pagi)'
                    WHEN EXTRACT(HOUR FROM d.datetime) < 18 THEN '12:00-18:00 (Siang)'
                    ELSE '18:00-24:00 (Sore/Malam)'
                END as periode,
                MIN(d.hum)::numeric(5,2) as min_hum,
                MAX(d.hum)::numeric(5,2) as max_hum,
                AVG(d.hum)::numeric(5,2) as avg_hum,
                COUNT(*) as cnt
             FROM tb_data d
             WHERE TRIM(d.id_device) = ANY($1::text[])
               AND d.datetime::DATE = $2::DATE
             GROUP BY TRIM(d.id_device), periode
             ORDER BY TRIM(d.id_device), MIN(d.datetime)`,
            [rawDeviceIds, today]
        );

        let currentDev = '';
        verifyQuery.rows.forEach(row => {
            if (row.device !== currentDev) {
                currentDev = row.device;
                const location = devQuery.rows.find(d => d.id_device.trim() === row.device)?.location;
                console.log(`\n  📡 ${row.device} (${location}):`);
            }
            const maxOk = parseFloat(row.max_hum) <= 62.5;
            const status = maxOk ? '✅' : '⚠️ ';
            console.log(`     ${status} ${row.periode.padEnd(28)} | ${row.min_hum}% - ${row.max_hum}% | avg: ${row.avg_hum}% | ${row.cnt} data`);
        });

        console.log('\n' + '='.repeat(65));
        console.log('🎉 Selesai! Kurva humidity sudah realistis.');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ ERROR - Rollback:', error.message);
        console.error(error.stack);
    } finally {
        client.release();
        pool.end();
    }
}

main();
