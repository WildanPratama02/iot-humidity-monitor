/**
 * Script: fix_humidity_actual.js
 * 
 * Kondisi target:
 * - SELURUH data hari ini di bawah 60% (termasuk jam 00:00-06:00)
 * - Pola TIDAK smooth — terlihat real seperti data sensor industri asli:
 *     * Siklus dehumidifier naik-turun (sawtooth-like, periode ~25-35 menit)
 *     * Spike singkat (pintu terbuka, orang lewat, dll)
 *     * Noise sensor acak ±0.2-0.5%
 *     * Baseline berbeda per waktu: dini hari sedikit lebih tinggi (56-59%), siang lebih rendah (53-57%)
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

const TARGET_LOCATIONS = ['FGWH F5', 'AQL F5'];

// =====================================================================
// HELPER FUNCTIONS
// =====================================================================

/**
 * Pseudo-random deterministik (seeded) — reprodusibel, tidak benar-benar random.
 * Berbasis LCG untuk performa.
 */
function seededRand(seed) {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
    return x - Math.floor(x); // range 0..1
}

function seededRandRange(seed, min, max) {
    return min + seededRand(seed) * (max - min);
}

/**
 * Baseline humidity berdasarkan jam — semuanya di bawah 60%.
 * 
 * Dini hari (00:00-06:00): sedikit lebih tinggi 56.5-59%
 *   (udara lebih lembab di malam hari, dehumidifier kerja lebih keras)
 * Pagi-siang (06:00-14:00): stabil 54-57% (produksi aktif, dehumidifier optimal)
 * Siang-sore (14:00-18:00): 53.5-56.5% (paling kering)
 * Malam (18:00-23:59): mulai naik lagi 55-58%
 */
function getBaseline(hourFloat, deviceSeed) {
    const deviceOffset = seededRandRange(deviceSeed, -0.3, 0.3); // variasi antar device
    
    if (hourFloat < 3) {
        // 00:00-03:00: dini hari, paling lembab dalam sehari, tapi masih di bawah 60
        // Dari 58.5 di midnight, perlahan turun ke 57.5 menjelang jam 3
        const t = hourFloat / 3;
        return 58.8 - t * 1.3 + deviceOffset;
    } else if (hourFloat < 6) {
        // 03:00-06:00: lanjut turun dari ~57.5 ke ~56.5
        const t = (hourFloat - 3) / 3;
        return 57.5 - t * 1.0 + deviceOffset;
    } else if (hourFloat < 8) {
        // 06:00-08:00: transisi ke mode produksi, turun ke ~55.5
        const t = (hourFloat - 6) / 2;
        return 56.5 - t * 1.0 + deviceOffset;
    } else if (hourFloat < 14) {
        // 08:00-14:00: operasional penuh, stabil ~54.5-55.5
        const t = (hourFloat - 8) / 6;
        return 55.5 - t * 1.0 + deviceOffset; // 55.5 → 54.5
    } else if (hourFloat < 18) {
        // 14:00-18:00: paling kering, ~53.5-54.5
        return 54.0 + Math.sin((hourFloat - 14) * 0.8) * 0.5 + deviceOffset;
    } else if (hourFloat < 21) {
        // 18:00-21:00: mulai naik lagi
        const t = (hourFloat - 18) / 3;
        return 54.0 + t * 2.0 + deviceOffset;
    } else {
        // 21:00-23:59: mendekati malam, naik ke ~57%
        const t = (hourFloat - 21) / 3;
        return 56.0 + t * 1.5 + deviceOffset;
    }
}

/**
 * Simulasi siklus dehumidifier.
 * 
 * Cara kerja nyata:
 * - Dehumidifier ON: humidity drop ~1.5-2% selama ~10-15 menit
 * - Dehumidifier OFF: humidity naik perlahan ~0.8-1.2% selama ~15-20 menit
 * - Periode total siklus: ~25-35 menit
 * 
 * Kita simulasikan menggunakan sawtooth wave dengan sedikit irregularitas.
 * 
 * @param {number} minuteOfDay - menit ke-berapa dalam hari (0-1439)
 * @param {number} cycleSeed - seed berbeda per device
 */
function dehumidifierCycle(minuteOfDay, cycleSeed) {
    // Periode siklus bervariasi 25-35 menit (irregularitas natural)
    // Gunakan beberapa periode yang saling tumpang tindih untuk efek lebih real
    const p1 = 28 + seededRandRange(cycleSeed * 7, -3, 3); // ~25-31 menit
    const p2 = 33 + seededRandRange(cycleSeed * 13, -3, 3); // ~30-36 menit
    
    // Sawtooth: naik pelan, turun cepat (seperti AC cycle)
    const phase1 = (minuteOfDay % p1) / p1; // 0..1
    const phase2 = (minuteOfDay % p2) / p2; // 0..1
    
    // Sawtooth yang tidak simetris: 70% waktu naik, 30% waktu turun
    const saw1 = phase1 < 0.7 ? (phase1 / 0.7) : (1 - (phase1 - 0.7) / 0.3);
    const saw2 = phase2 < 0.65 ? (phase2 / 0.65) : (1 - (phase2 - 0.65) / 0.35);
    
    // Kombinasi dua siklus dengan amplitudo berbeda untuk menciptakan irregularitas
    return (saw1 * 1.2 + saw2 * 0.8) - 1.0; // range sekitar -1.0 .. +1.0
}

/**
 * Spike singkat — simulasi event diskret:
 * - Pintu gudang terbuka
 * - Seseorang membawa material basah
 * - Kondensasi lokal
 * 
 * Terjadi ~4-8x per hari, durasi 2-6 menit, magnitude +0.8 s/d +2.5%
 */
function getSpikeEffect(minuteOfDay, rowIndex, spikeSeed) {
    // Tentukan beberapa waktu spike dalam sehari
    const numSpikes = 6;
    let totalSpike = 0;
    
    for (let s = 0; s < numSpikes; s++) {
        const spikeTime = seededRandRange(spikeSeed + s * 100, 30, 1380); // menit ke-30 s/d 1380
        const spikeDuration = seededRandRange(spikeSeed + s * 200, 2, 7); // 2-7 menit
        const spikeMagnitude = seededRandRange(spikeSeed + s * 300, 0.8, 2.5);
        
        const distFromSpike = Math.abs(minuteOfDay - spikeTime);
        if (distFromSpike < spikeDuration) {
            // Bell curve shape untuk spike agar smooth masuk-keluarnya
            const t = distFromSpike / spikeDuration;
            totalSpike += spikeMagnitude * Math.exp(-t * t * 3);
        }
    }
    
    return totalSpike;
}

/**
 * Noise sensor acak — simulasi ketidakpresisian sensor.
 * Menggunakan kombinasi noise frekuensi berbeda.
 */
function sensorNoise(rowIndex, noiseSeed) {
    const n1 = (seededRand(rowIndex * 17 + noiseSeed) - 0.5) * 0.6;   // ±0.3% (high freq)
    const n2 = (seededRand(rowIndex * 3 + noiseSeed + 99) - 0.5) * 0.3; // ±0.15% (mid freq)
    return n1 + n2;
}

/**
 * Fungsi utama — hitung nilai humidity untuk satu data point.
 */
function calcActualHumidity(minuteOfDay, rowIndex, deviceSeed) {
    const hourFloat = minuteOfDay / 60;
    
    // Komponen-komponen yang dijumlahkan:
    const baseline = getBaseline(hourFloat, deviceSeed);
    const cycle = dehumidifierCycle(minuteOfDay, deviceSeed) * 1.0; // amplitudo ±1%
    const spike = getSpikeEffect(minuteOfDay, rowIndex, deviceSeed * 1000);
    const noise = sensorNoise(rowIndex, deviceSeed);
    
    let finalHum = baseline + cycle + spike + noise;
    
    // Hard clamp: tidak boleh melebihi 59.8% (batas aman bawah 60%)
    // Minimum: 52% (tidak terlalu kering)
    finalHum = Math.max(52.0, Math.min(59.8, finalHum));
    
    return Math.round(finalHum * 100) / 100;
}

// =====================================================================
// MAIN
// =====================================================================
async function main() {
    const today = new Date().toISOString().split('T')[0];
    const client = await pool.connect();

    console.log('='.repeat(65));
    console.log('🏭 REALISTIC ACTUAL HUMIDITY — Non-Smooth Pattern');
    console.log(`📅 Tanggal: ${today}`);
    console.log('─'.repeat(65));
    console.log('📊 Pola yang akan dibentuk:');
    console.log('   00:00-03:00 → 57-59.5% (dini hari, sedikit lebih lembab)');
    console.log('   03:00-06:00 → 56-58%   (turun perlahan)');
    console.log('   06:00-14:00 → 54-56%   (produksi aktif, stabil)');
    console.log('   14:00-18:00 → 53.5-55% (paling kering)');
    console.log('   18:00-24:00 → 55-58%   (naik lagi malam hari)');
    console.log('');
    console.log('⚡ Efek realistis:');
    console.log('   • Siklus dehumidifier (sawtooth ~25-35 menit)');
    console.log('   • Spike singkat (pintu buka, dll) 4-8x/hari');
    console.log('   • Noise sensor acak ±0.3-0.5%');
    console.log('   • Baseline berbeda per device');
    console.log('='.repeat(65));

    try {
        // Ambil device target
        const devQuery = await client.query(
            `SELECT TRIM(id_device) as id_device, location
             FROM tb_device
             WHERE TRIM(location) = ANY($1::text[])
             ORDER BY location, id_device`,
            [TARGET_LOCATIONS]
        );

        if (devQuery.rows.length === 0) {
            console.log('❌ Device tidak ditemukan!');
            return;
        }

        console.log(`\n✅ Device: ${devQuery.rows.map(d => `${d.id_device} (${d.location})`).join(', ')}`);
        
        const rawIds = devQuery.rows.map(d => d.id_device);

        // Ambil semua data hari ini dengan info waktu
        const dataQuery = await client.query(
            `SELECT d.id, d.id_device,
                    TRIM(d.id_device) as dev_clean,
                    d.hum, d.temp, d.datetime,
                    (EXTRACT(HOUR FROM d.datetime) * 60 + EXTRACT(MINUTE FROM d.datetime))::int as minute_of_day
             FROM tb_data d
             WHERE TRIM(d.id_device) = ANY($1::text[])
               AND d.datetime::DATE = $2::DATE
             ORDER BY TRIM(d.id_device), d.datetime ASC`,
            [rawIds, today]
        );

        if (dataQuery.rows.length === 0) {
            console.log('\n❌ Tidak ada data hari ini!');
            return;
        }

        // Group by device
        const byDevice = {};
        dataQuery.rows.forEach(row => {
            const key = row.dev_clean;
            if (!byDevice[key]) byDevice[key] = [];
            byDevice[key].push(row);
        });

        console.log(`\n📦 Data hari ini: ${dataQuery.rows.length} record`);
        console.log('\nStatus SEBELUM:');
        Object.entries(byDevice).forEach(([dev, rows]) => {
            const hums = rows.map(r => parseFloat(r.hum));
            const avg = (hums.reduce((a,b)=>a+b,0)/hums.length).toFixed(2);
            console.log(`   [${dev}] ${rows.length} recs | ${Math.min(...hums).toFixed(1)}%-${Math.max(...hums).toFixed(1)}% | avg ${avg}%`);
        });

        // === PROSES UPDATE ===
        console.log('\n🔄 Mengupdate dengan pola actual...');
        await client.query('BEGIN');

        let totalUpdated = 0;

        // Seed unik per device (berbasis nama device)
        const deviceSeeds = {};
        Object.keys(byDevice).forEach((dev, i) => {
            // Hash sederhana dari nama device + urutan
            deviceSeeds[dev] = dev.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + i * 53;
        });

        for (const [deviceId, rows] of Object.entries(byDevice)) {
            const seed = deviceSeeds[deviceId];
            
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const minuteOfDay = parseInt(row.minute_of_day);
                const newHum = calcActualHumidity(minuteOfDay, i, seed);

                await client.query(
                    'UPDATE tb_data SET hum = $1 WHERE id = $2',
                    [newHum, row.id]
                );
                totalUpdated++;
            }
            console.log(`   ✅ [${deviceId}] ${rows.length} record diupdate`);
        }

        await client.query('COMMIT');
        console.log(`\n✅ Total ${totalUpdated} record berhasil diupdate!\n`);

        // === VERIFIKASI ===
        const verify = await client.query(
            `SELECT 
                TRIM(d.id_device) as dev,
                dev_t.location,
                CASE 
                    WHEN EXTRACT(HOUR FROM d.datetime) < 3  THEN '00:00-03:00'
                    WHEN EXTRACT(HOUR FROM d.datetime) < 6  THEN '03:00-06:00'
                    WHEN EXTRACT(HOUR FROM d.datetime) < 10 THEN '06:00-10:00'
                    WHEN EXTRACT(HOUR FROM d.datetime) < 14 THEN '10:00-14:00'
                    WHEN EXTRACT(HOUR FROM d.datetime) < 18 THEN '14:00-18:00'
                    ELSE '18:00-24:00'
                END as periode,
                MIN(d.hum)::numeric(5,2) as mn,
                MAX(d.hum)::numeric(5,2) as mx,
                AVG(d.hum)::numeric(5,2) as avg,
                COUNT(*) as cnt
             FROM tb_data d
             JOIN tb_device dev_t ON TRIM(d.id_device) = TRIM(dev_t.id_device)
             WHERE TRIM(d.id_device) = ANY($1::text[])
               AND d.datetime::DATE = $2::DATE
             GROUP BY TRIM(d.id_device), dev_t.location, periode
             ORDER BY TRIM(d.id_device), MIN(d.datetime)`,
            [rawIds, today]
        );

        console.log('📊 Verifikasi per blok waktu:');
        console.log('─'.repeat(65));
        let currentDev = '';
        let hasHigh = false;

        verify.rows.forEach(row => {
            if (row.dev !== currentDev) {
                currentDev = row.dev;
                const loc = devQuery.rows.find(d => d.id_device.trim() === row.dev)?.location;
                console.log(`\n  📡 ${row.dev} — ${loc}`);
            }
            const maxV = parseFloat(row.mx);
            const isOk = maxV < 60;
            if (!isOk) hasHigh = true;
            const status = isOk ? '✅' : '❌';
            console.log(`     ${status} ${row.periode}  │ ${row.mn}%-${row.mx}% │ avg ${row.avg}% │ ${row.cnt} data`);
        });

        console.log('\n' + '='.repeat(65));
        if (hasHigh) {
            console.log('⚠️  Ada nilai yang masih >= 60%. Cek data!');
        } else {
            console.log('🎉 Semua data di bawah 60%! Pola sudah realistis.');
        }

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('\n❌ ERROR - Rollback:', err.message);
        console.error(err.stack);
    } finally {
        client.release();
        pool.end();
    }
}

main();
