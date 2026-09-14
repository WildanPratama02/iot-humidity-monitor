const pool = require('./src/config/database');

async function checkByDevice() {
    console.log('🔍 Mencari row yang corrupt berdasarkan query aplikasi...');

    try {
        const devices = await pool.query("SELECT DISTINCT location, id_device FROM tb_device");
        
        for (const device of devices.rows) {
            console.log(`Mengecek data untuk device: ${device.id_device} (${device.location})...`);
            try {
                // Fetch using the exact query from dataController.js
                await pool.query(`SELECT id, id_device, temp, hum, datetime FROM tb_data WHERE id_device = $1 ORDER BY datetime DESC LIMIT 1440`, [device.id_device]);
            } catch (err) {
                if (err.code === 'XX001') {
                    console.log(`❌ Ditemukan ERROR korupsi saat fetch data limit 1440 untuk device ${device.id_device}!`);
                    
                    // Let's find exactly which row
                    console.log('Sedang mencari baris spesifik...');
                    const allRowsForDeviceQuery = await pool.query(`SELECT id FROM tb_data WHERE id_device = $1 ORDER BY datetime DESC`, [device.id_device]);
                    for(const r of allRowsForDeviceQuery.rows) {
                         try {
                             await pool.query(`SELECT id, id_device, temp, hum, datetime FROM tb_data WHERE id = $1`, [r.id]);
                         } catch(singleErr) {
                             if(singleErr.code === 'XX001') {
                                 console.log(`💥 MENGHAPUS ROW KORUP: ID = ${r.id} (Device: ${device.id_device})`);
                                 await pool.query('DELETE FROM tb_data WHERE ctid IN (SELECT ctid FROM tb_data WHERE id = $1)', [r.id]);
                             }
                         }
                    }
                } else {
                    console.error(`Error lain pada device ${device.id_device}`, err.message);
                }
            }
        }
        console.log('Selesai.');
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
checkByDevice();
