require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});
const today = new Date().toISOString().split('T')[0];
pool.query(
    `SELECT id_device, COUNT(*) as total, 
            MIN(hum)::numeric(5,2) as min_hum, 
            MAX(hum)::numeric(5,2) as max_hum, 
            AVG(hum)::numeric(5,2) as avg_hum 
     FROM tb_data 
     WHERE id_device IN ('F5FG01 ','F5FG02 ','B1MT02 ','F5AQL01') 
       AND datetime::DATE = $1
     GROUP BY id_device ORDER BY id_device`,
    [today]
).then(r => {
    console.log('Status data hari ini (' + today + '):');
    if (r.rows.length === 0) {
        console.log('  Tidak ada data untuk device-device tersebut');
    } else {
        r.rows.forEach(row => console.log(`  ${row.id_device}: total=${row.total} | hum: ${row.min_hum}%-${row.max_hum}% | avg: ${row.avg_hum}%`));
    }
    
    // Cek juga ID_device dengan trailing space (beberapa device ID ada spasi)
    return pool.query(
        `SELECT id_device, location FROM tb_device WHERE location IN ('FGWH F5','AQL F5','IMWH B1 ROOM') ORDER BY location`
    );
}).then(r => {
    console.log('\nDevice IDs di database:');
    r.rows.forEach(d => console.log(`  "${d.id_device}" -> ${d.location}`));
    pool.end();
}).catch(e => {
    console.error(e.message);
    pool.end();
});
