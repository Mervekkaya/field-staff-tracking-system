const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function updateAdminPassword() {
  try {
    console.log('🔄 Admin şifresi güncelleniyor...\n');

    const email = 'merve@adminkonumtakip.com';
    const newPassword = 'Admin123!'; // Yeni şifre

    // Kullanıcıyı kontrol et
    const checkQuery = 'SELECT * FROM users WHERE email = $1';
    const existingUser = await pool.query(checkQuery, [email]);

    if (existingUser.rows.length === 0) {
      console.log('❌ Bu email ile kayıtlı kullanıcı bulunamadı!');
      return;
    }

    console.log('✅ Kullanıcı bulundu:', existingUser.rows[0].email);

    // Yeni şifreyi hash'le
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Şifreyi güncelle
    const updateQuery = `
      UPDATE users 
      SET password = $1 
      WHERE email = $2
      RETURNING id, email, role, created_at;
    `;

    const result = await pool.query(updateQuery, [hashedPassword, email]);
    const updatedUser = result.rows[0];

    console.log('\n✅ Admin şifresi başarıyla güncellendi!\n');
    console.log('📧 Email:', updatedUser.email);
    console.log('🔒 Yeni Şifre:', newPassword);
    console.log('👤 Role:', updatedUser.role);
    console.log('🆔 ID:', updatedUser.id);
    console.log('📅 Oluşturulma:', updatedUser.created_at);
    console.log('\n⚠️  ÖNEMLİ: Yeni şifreyi güvenli bir yerde sakla!\n');

  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await pool.end();
  }
}

updateAdminPassword();
