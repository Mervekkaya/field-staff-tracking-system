const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// Kullanıcı kaydı
const register = async (req, res) => {
  try {
    const { email, password, role = 'user' } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email ve şifre gerekli',
        error: 'MISSING_FIELDS'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Şifre en az 6 karakter olmalı',
        error: 'PASSWORD_TOO_SHORT'
      });
    }

    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Geçerli bir email adresi girin',
        error: 'INVALID_EMAIL'
      });
    }

    // Kullanıcı zaten var mı kontrol et
    const existingUser = await User.findByEmail(email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({
        message: 'Bu email adresi zaten kayıtlı',
        error: 'EMAIL_EXISTS'
      });
    }

    // Kullanıcıyı oluştur
    const newUser = await User.create(email.toLowerCase(), password, role);

    // JWT token oluştur
    const token = generateToken(newUser.id, newUser.email, newUser.role);

    res.status(201).json({
      message: 'Kullanıcı başarıyla oluşturuldu',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        created_at: newUser.created_at
      },
      token
    });

  } catch (error) {
    console.error('Register error:', error);
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

    console.log('🔄 Login isteği alındı:', { email: email ? email.toLowerCase() : 'yok', hasPassword: !!password });

    // Validation
    if (!email || !password) {
      console.log('❌ Login validation hatası: Email veya şifre eksik');
      return res.status(400).json({
        success: false,
        message: 'Email ve şifre gerekli',
        details: { error: 'MISSING_FIELDS' }
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log('🔍 Kullanıcı aranıyor:', normalizedEmail);

    // Kullanıcıyı bul
    const user = await User.findByEmail(normalizedEmail);
    if (!user) {
      console.log('❌ Kullanıcı bulunamadı:', normalizedEmail);
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre',
        details: { error: 'INVALID_CREDENTIALS' }
      });
    }

    console.log('✅ Kullanıcı bulundu:', { id: user.id, email: user.email, role: user.role });

    // Şifreyi kontrol et
    const isPasswordValid = await User.verifyPassword(password, user.password);

    if (!isPasswordValid) {
      console.log('❌ Şifre yanlış:', normalizedEmail);
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre',
        details: { error: 'INVALID_CREDENTIALS' }
      });
    }

    // JWT token oluştur
    const token = generateToken(user.id, user.email, user.role);

    console.log('✅ Login başarılı:', {
      email: user.email,
      role: user.role,
      id: user.id
    });

    res.json({
      success: true,
      message: 'Giriş başarılı',
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      token
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      details: { error: 'SERVER_ERROR' }
    });
  }
};

// Kullanıcı bilgilerini getir (token ile)
const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'Kullanıcı bulunamadı',
        error: 'USER_NOT_FOUND'
      });
    }

    res.json({
      message: 'Kullanıcı bilgileri',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      message: 'Sunucu hatası',
      error: 'SERVER_ERROR'
    });
  }
};

// Çıkış (token blacklist için - şimdilik basit)
const logout = async (req, res) => {
  try {
    // Şimdilik sadece başarı mesajı döndür
    // İleride token blacklist eklenebilir
    res.json({
      message: 'Çıkış başarılı'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      message: 'Sunucu hatası',
      error: 'SERVER_ERROR'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout
};