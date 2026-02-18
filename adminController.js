const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');
const nodemailer = require('nodemailer');

// E-posta gönderici yapılandırması
// NOT: Gerçek kullanım için Gmail kullanıyorsanız 'App Password' almanız gerekebilir
// veya SendGrid, AWS SES gibi servisler kullanılabilir.
const transporter = nodemailer.createTransport({
  service: 'gmail', // Veya kendi SMTP sunucunuz
  auth: {
    user: 'mrv.ka.22.07@gmail.com', // ⚠️ Burayı kendi mailinizle değiştirin
    pass: '5562001.Mk' // ⚠️ Burayı şifrenizle değiştirin
  }
});

const sendWelcomeEmail = async (email, password) => {
  const mailOptions = {
    from: '"Konum Takip Sistemi" <noreply@konumtakip.com>',
    to: email,
    subject: 'Hesabınız Oluşturuldu - Giriş Bilgileri',
    text: `Merhaba,\n\nKonum Takip Sistemi hesabınız oluşturuldu.\n\nGiriş Bilgileriniz:\nEmail: ${email}\nŞifre: ${password}\n\nLütfen uygulamaya giriş yaptıktan sonra güvenliğiniz için şifrenizi değiştiriniz.\n\nİyi çalışmalar.`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Hoş geldin maili gönderildi: ${email}`);
  } catch (error) {
    console.error('❌ Mail gönderme hatası:', error);
    // Mail gitmese bile kodun akışını bozmamak için hatayı yutuyoruz
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const query = `
      SELECT id, email, role, created_at
      FROM users
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query);

    res.json({
      message: 'Kullanıcılar başarıyla getirildi',
      users: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('GetAllUsers error:', error);
    res.status(500).json({
      message: 'Sunucu hatası',
      error: 'SERVER_ERROR'
    });
  }
};

// kullanıcıyı güncelle (admin)
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, role, defined_area } = req.body;

    console.log('🔄 UpdateUser çağrıldı:', { userId, email, role, defined_area });

    // Girdi doğrulama
    if (!email || !role) {
      console.log('❌ Validation hatası: Email veya rol eksik');
      return res.status(400).json({
        message: 'Email ve rol alanları gereklidir',
        error: 'MISSING_FIELDS'
      });
    }

    // Kullanıcının var olup olmadığını kontrol et
    const userCheckQuery = 'SELECT id FROM users WHERE id = $1';
    const userCheckResult = await pool.query(userCheckQuery, [userId]);

    if (userCheckResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Kullanıcı bulunamadı',
        error: 'USER_NOT_FOUND'
      });
    }

    // Kullanıcıyı defined_area ile güncelle
    const updateQuery = `
      UPDATE users 
      SET email = $1, role = $2, defined_area = $3
      WHERE id = $4
      RETURNING id, email, role, defined_area, created_at
    `;

    const result = await pool.query(updateQuery, [email, role, defined_area || null, userId]);

    console.log('✅ Kullanıcı güncellendi:', result.rows[0]);

    res.json({
      message: 'Kullanıcı başarıyla güncellendi',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('❌ UpdateUser error:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      message: 'Sunucu hatası',
      error: 'SERVER_ERROR'
    });
  }
};

//  kullanıcı konumlarını al (admin)
const getUserLocations = async (req, res) => {
  try {
    const { userId } = req.params;

    // Kullanıcının var olup olmadığını kontrol et ve defined_area dahil tüm kullanıcı bilgilerini al
    const userQuery = 'SELECT id, email, role, defined_area, created_at FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Kullanıcı bulunamadı',
        error: 'USER_NOT_FOUND'
      });
    }

    // Kullanıcı konumlarını al
    const locationsQuery = `
      SELECT id, latitude, longitude, timestamp
      FROM locations
      WHERE user_id = $1
      ORDER BY timestamp DESC
      LIMIT 100
    `;

    const locationsResult = await pool.query(locationsQuery, [userId]);

    res.json({
      message: 'Kullanıcı konumları başarıyla getirildi',
      user: userResult.rows[0],
      locations: locationsResult.rows,
      count: locationsResult.rows.length
    });
  } catch (error) {
    console.error('GetUserLocations error:', error);
    res.status(500).json({
      message: 'Sunucu hatası',
      error: 'SERVER_ERROR'
    });
  }
};

// harita üzeirnnde tüm kullanıcıları ve son konumlarını al (admin)
const getAllUsersWithLocations = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id,
        u.email,
        u.role,
        u.created_at,
        l.latitude,
        l.longitude,
        l.timestamp as last_location_timestamp
      FROM users u
      LEFT JOIN (
        SELECT DISTINCT ON (user_id) 
          user_id, 
          latitude, 
          longitude, 
          timestamp
        FROM locations
        ORDER BY user_id, timestamp DESC
      ) l ON u.id = l.user_id
      WHERE u.role != 'admin'
      ORDER BY u.created_at DESC
    `;

    const result = await pool.query(query);

    res.json({
      message: 'Tüm kullanıcılar ve son konumları başarıyla getirildi',
      users: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('GetAllUsersWithLocations error:', error);
    res.status(500).json({
      message: 'Sunucu hatası',
      error: 'SERVER_ERROR'
    });
  }
};

// kullanıcıyı sil (admin)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Kullanıcının var olup olmadığını kontrol et
    const userCheckQuery = 'SELECT id FROM users WHERE id = $1';
    const userCheckResult = await pool.query(userCheckQuery, [userId]);

    if (userCheckResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Kullanıcı bulunamadı',
        error: 'USER_NOT_FOUND'
      });
    }

    // Kullanıcıyı sil
    const deleteQuery = 'DELETE FROM users WHERE id = $1';
    await pool.query(deleteQuery, [userId]);

    res.json({
      message: 'Kullanıcı başarıyla silindi'
    });
  } catch (error) {
    console.error('DeleteUser error:', error);
    res.status(500).json({
      message: 'Sunucu hatası',
      error: 'SERVER_ERROR'
    });
  }
};

// kullanıcı oluştur (admin)
const createUser = async (req, res) => {
  try {
    const { email, password, role = 'user', defined_area } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email ve şifre gerekli',
        error: 'MISSING_FIELDS'
      });
    }

    // Kullanıcının zaten var olup olmadığını kontrol et
    const userCheckQuery = 'SELECT id FROM users WHERE email = $1';
    const userCheckResult = await pool.query(userCheckQuery, [email]);

    if (userCheckResult.rows.length > 0) {
      return res.status(409).json({
        message: 'Bu email zaten kayıtlı',
        error: 'EMAIL_EXISTS'
      });
    }

    // Şifreyi hashle
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Kullanıcı oluştur
    const insertQuery = `
      INSERT INTO users (email, password, role, defined_area, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, email, role, defined_area, created_at
    `;

    const result = await pool.query(insertQuery, [email, hashedPassword, role, defined_area || null]);

    // Kullanıcı oluşturulduktan sonra mail at
    await sendWelcomeEmail(email, password);

    res.status(201).json({
      message: 'Kullanıcı başarıyla oluşturuldu',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('CreateUser error:', error);
    res.status(500).json({
      message: 'Sunucu hatası',
      error: 'SERVER_ERROR'
    });
  }
};

// Kullanıcı girişi
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email ve şifre gerekli',
        error: 'MISSING_FIELDS'
      });
    }

    // Kullanıcıyı bul
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(userQuery, [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Kullanıcı bulunamadı',
        error: 'USER_NOT_FOUND'
      });
    }

    const user = result.rows[0];

    // Şifre kontrolü
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: 'Hatalı şifre',
        error: 'INVALID_PASSWORD'
      });
    }

    // JWT token oluştur
    const token = generateToken(user.id, user.email, user.role);

    res.json({
      message: 'Giriş başarılı',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      },
      token // Token'ı frontend'e gönder
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Sunucu hatası',
      error: 'SERVER_ERROR'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserLocations,
  getAllUsersWithLocations,
  updateUser,
  deleteUser,
  createUser,
  login
};