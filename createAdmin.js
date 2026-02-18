const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function createAdminUser() {
    try {
        console.log('🔄 Admin kullanıcısı oluşturuluyor...\n');

        const email = 'merve@adminkonumtakip.com';
        const password = 'Merve123!'; // admin giriş kayıt kısmın güvenlik açısından güncellemen lazım ama şimdilik kalsın 
        const role = 'admin';

        // Kullanıcı zaten var mı kontrol et
        const checkQuery = 'SELECT * FROM users WHERE email = $1';
        const existingUser = await pool.query(checkQuery, [email]);

        if (existingUser.rows.length > 0) {
            console.log('⚠️  Bu email ile kayıtlı kullanıcı zaten var!');
            console.log('📧 Email:', existingUser.rows[0].email);
            console.log('👤 Role:', existingUser.rows[0].role);
            console.log('📅 Oluşturulma:', existingUser.rows[0].created_at);

            // Şifreyi güncellemek ister misin?
            console.log('\n💡 Şifreyi güncellemek için UPDATE sorgusu kullanabilirsiniz.');
            return;
        }

        // Şifreyi hash'leweb 
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Admin kullanıcısını oluştur
        const insertQuery = `
      INSERT INTO users (email, password, role, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, email, role, created_at;
    `;

        const result = await pool.query(insertQuery, [email, hashedPassword, role]);
        const adminUser = result.rows[0];

        console.log('✅ Admin kullanıcısı başarıyla oluşturuldu!\n');
        console.log('📧 Email:', adminUser.email);
        console.log('🔒 Şifre:', password);
        console.log('👤 Role:', adminUser.role);
        console.log('🆔 ID:', adminUser.id);
        console.log('📅 Oluşturulma:', adminUser.created_at);
        console.log('\n⚠️  ÖNEMLİ: Şifreyi güvenli bir yerde sakla!\n');

    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        await pool.end();
    }
}

createAdminUser();
