// Global error handler middleware

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // JWT hataları
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Geçersiz token',
      error: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token süresi dolmuş',
      error: 'TOKEN_EXPIRED'
    });
  }

  // Veritabanı hataları
  if (err.code === '23505') { // Unique constraint violation
    return res.status(409).json({
      message: 'Bu kayıt zaten mevcut',
      error: 'DUPLICATE_ENTRY'
    });
  }

  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({
      message: 'İlişkili kayıt bulunamadı',
      error: 'FOREIGN_KEY_VIOLATION'
    });
  }

  // Varsayılan hata
  res.status(err.status || 500).json({
    message: err.message || 'Sunucu hatası',
    error: process.env.NODE_ENV === 'development' ? err.stack : 'INTERNAL_SERVER_ERROR'
  });
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    message: 'Endpoint bulunamadı',
    path: req.originalUrl,
    method: req.method,
    error: 'NOT_FOUND'
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
