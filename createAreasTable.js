const { pool } = require('../config/database');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function createAreasTable() {
    try {
        console.log('🔄 Areas tablosu oluşturuluyor...\n');

        // Tablo zaten var mı kontrol et
        const checkTableQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'areas';
    `;

        const checkResult = await pool.query(checkTableQuery);

        if (checkResult.rows.length > 0) {
            console.log('✅ Areas tablosu zaten mevcut!');
        } else {
            // Tabloyu oluştur
            const createTableQuery = `
        CREATE TABLE areas (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          coordinates JSONB NOT NULL,
          color VARCHAR(50) DEFAULT '#7f007f',
          created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

            await pool.query(createTableQuery);
            console.log('✅ Areas tablosu başarıyla oluşturuldu!');

            // Index ekle
            await pool.query('CREATE INDEX idx_areas_created_by ON areas(created_by);');
            console.log('✅ Index eklendi!');
        }

        // Tablo yapısını göster
        const tableInfoQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'areas' 
      ORDER BY ordinal_position;
    `;

        const tableInfo = await pool.query(tableInfoQuery);

        console.log('\n📋 Areas Tablosu Yapısı:');
        console.log('─────────────────────────────────────────');
        tableInfo.rows.forEach(col => {
            console.log(`${col.column_name.padEnd(20)} | ${col.data_type.padEnd(20)} | ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
        console.log('─────────────────────────────────────────\n');

        console.log('🎉 Hazır! Artık bölgeleri kaydedebilirsiniz.\n');

    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        await pool.end();
    }
}

createAreasTable();
