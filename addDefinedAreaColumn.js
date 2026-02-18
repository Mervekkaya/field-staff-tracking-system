const { pool } = require('../config/database');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function addDefinedAreaColumn() {
    try {
        console.log('🔄 defined_area kolonu ekleniyor...\n');

        // Kolon zaten var mı kontrol et
        const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'defined_area';
    `;

        const checkResult = await pool.query(checkColumnQuery);

        if (checkResult.rows.length > 0) {
            console.log('✅ defined_area kolonu zaten mevcut!');
        } else {
            // Kolonu ekle
            const addColumnQuery = `
        ALTER TABLE users 
        ADD COLUMN defined_area VARCHAR(255);
      `;

            await pool.query(addColumnQuery);
            console.log('✅ defined_area kolonu başarıyla eklendi!');
        }

        // Tablo yapısını göster
        const tableInfoQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `;

        const tableInfo = await pool.query(tableInfoQuery);

        console.log('\n📋 Users Tablosu Yapısı:');
        console.log('─────────────────────────────────────────');
        tableInfo.rows.forEach(col => {
            console.log(`${col.column_name.padEnd(20)} | ${col.data_type.padEnd(20)} | ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
        console.log('─────────────────────────────────────────\n');

    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        await pool.end();
    }
}

addDefinedAreaColumn();
