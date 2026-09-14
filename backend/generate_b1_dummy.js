/**
 * Script: generate_b1_dummy.js
 * Tujuan: Membuat data dummy untuk lokasi IMWH B1 ROOM (B1MT02 ) 
 *         pada jam 00:00 sampai jam 07:00 hari ini (2026-05-22)
 *         berdasarkan data hari sebelumnya (2026-05-21) dengan noise acak natural.
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

// Seeded random for reproducible variations if needed, or simple math random
function getRandomNoise(min, max) {
    return min + Math.random() * (max - min);
}

async function main() {
    const targetLocation = 'IMWH B1 ROOM';
    console.log('='.repeat(70));
    console.log(`📊 GENERATING REALISTIC DUMMY DATA FOR ${targetLocation}`);
    console.log('='.repeat(70));

    const client = await pool.connect();

    try {
        // 1. Get device details
        const devQuery = await client.query(
            `SELECT id_device, location FROM tb_device WHERE TRIM(location) = $1`,
            [targetLocation]
        );

        if (devQuery.rows.length === 0) {
            console.log(`❌ Device dengan lokasi "${targetLocation}" tidak ditemukan!`);
            return;
        }

        const rawDeviceId = devQuery.rows[0].id_device;
        console.log(`✅ Found Device: "${rawDeviceId}" for location "${targetLocation}"`);

        // Define target dates
        const dateTodayStr = '2026-05-22';
        const dateYesterdayStr = '2026-05-21';

        // 2. Check today's existing records between 00:00:00 and 07:00:00
        const todayLimitQuery = await client.query(
            `SELECT MIN(datetime) as first_today, COUNT(*) as count_today
             FROM tb_data
             WHERE id_device = $1
               AND datetime >= '${dateTodayStr} 00:00:00'
               AND datetime < '${dateTodayStr} 07:00:00'`,
            [rawDeviceId]
        );

        const firstToday = todayLimitQuery.rows[0].first_today;
        const countToday = todayLimitQuery.rows[0].count_today;

        // Limit where we stop inserting dummy data to avoid overlapping with live data
        let insertLimitTime = `${dateTodayStr} 07:00:00`;
        if (firstToday) {
            // Convert to local time string for display/comparison
            const firstTodayLocal = new Date(firstToday).toLocaleString('id-ID', { timeZone: 'Asia/Bangkok' });
            console.log(`ℹ️ Server came online today at: ${firstTodayLocal} (Found ${countToday} real records)`);
            // We use the exact first_today date object as limit
            insertLimitTime = firstToday;
        } else {
            console.log(`ℹ️ No records found today between 00:00 and 07:00.`);
            insertLimitTime = new Date(`${dateTodayStr}T07:00:00+07:00`);
        }

        // 3. Get yesterday's data for reference
        const yesterdayQuery = await client.query(
            `SELECT datetime, temp, hum
             FROM tb_data
             WHERE id_device = $1
               AND datetime >= '${dateYesterdayStr} 00:00:00'
               AND datetime < '${dateYesterdayStr} 07:00:00'
             ORDER BY datetime ASC`,
            [rawDeviceId]
        );

        const yesterdayRecords = yesterdayQuery.rows;
        console.log(`📊 Found ${yesterdayRecords.length} records from yesterday (${dateYesterdayStr}) to replicate.`);

        if (yesterdayRecords.length === 0) {
            console.log(`❌ Tidak ada data kemarin untuk dijadikan referensi!`);
            return;
        }

        // 4. Start transaction
        await client.query('BEGIN');
        console.log('\n🔄 Inserting dummy records...');

        let insertedCount = 0;
        for (const record of yesterdayRecords) {
            const yesterdayTime = new Date(record.datetime);
            
            // Shift time by exactly +24 hours
            const todayTime = new Date(yesterdayTime.getTime() + 24 * 60 * 60 * 1000);

            // Check if this shifted record time is before the server came back online
            if (todayTime < new Date(insertLimitTime)) {
                // Add natural noise
                // Temp noise: ±0.1°C, Hum noise: ±0.15%
                const tempNoise = getRandomNoise(-0.1, 0.1);
                const humNoise = getRandomNoise(-0.15, 0.15);

                const newTemp = Math.round((record.temp + tempNoise) * 10) / 10;
                const newHum = Math.round((record.hum + humNoise) * 10) / 10;

                // Format datetime back to database local timestamp string (without timezone offset)
                // to make sure it inserts exactly at the local time matching PG's timestamp without timezone
                const offsetMs = 7 * 60 * 60 * 1000; // GMT+7 offset
                const localTimeObj = new Date(todayTime.getTime() + offsetMs);
                const formattedLocalTime = localTimeObj.toISOString().replace('T', ' ').substring(0, 23);

                await client.query(
                    `INSERT INTO tb_data (id_device, temp, hum, datetime)
                     VALUES ($1, $2, $3, $4)`,
                    [rawDeviceId, newTemp, newHum, formattedLocalTime]
                );

                insertedCount++;
            }
        }

        await client.query('COMMIT');
        console.log(`\n🎉 Success! Successfully generated and inserted ${insertedCount} dummy records.`);

        // 5. Verification
        console.log('\n🔍 VERIFICATION:');
        console.log('-'.repeat(70));
        
        const verifyQuery = await client.query(
            `SELECT 
                COUNT(*) as total_records,
                MIN(datetime) as first_datetime,
                MAX(datetime) as last_datetime,
                MIN(hum)::numeric(5,2) as min_hum,
                MAX(hum)::numeric(5,2) as max_hum,
                AVG(hum)::numeric(5,2) as avg_hum,
                MIN(temp)::numeric(5,2) as min_temp,
                MAX(temp)::numeric(5,2) as max_temp,
                AVG(temp)::numeric(5,2) as avg_temp
             FROM tb_data
             WHERE id_device = $1
               AND datetime >= '${dateTodayStr} 00:00:00'
               AND datetime < '${dateTodayStr} 07:00:00'`,
            [rawDeviceId]
        );

        const stats = verifyQuery.rows[0];
        console.log(`Total Records (Real + Dummy) : ${stats.total_records}`);
        console.log(`First Timestamp             : ${stats.first_datetime ? new Date(stats.first_datetime).toLocaleString('id-ID', { timeZone: 'Asia/Bangkok' }) : '-'}`);
        console.log(`Last Timestamp              : ${stats.last_datetime ? new Date(stats.last_datetime).toLocaleString('id-ID', { timeZone: 'Asia/Bangkok' }) : '-'}`);
        console.log(`Humidity Range              : ${stats.min_hum}% - ${stats.max_hum}% (Avg: ${parseFloat(stats.avg_hum).toFixed(2)}%)`);
        console.log(`Temperature Range           : ${stats.min_temp}°C - ${stats.max_temp}°C (Avg: ${parseFloat(stats.avg_temp).toFixed(2)}°C)`);
        console.log('-'.repeat(70));

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ ERROR - Rollback transaction:', err.message);
        console.error(err.stack);
    } finally {
        client.release();
        pool.end();
    }
}

main().catch(err => {
    console.error(err);
    pool.end();
});
