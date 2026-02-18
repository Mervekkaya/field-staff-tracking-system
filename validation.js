// Request validation middleware

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

// Kayıt validasyonu
const validateRegister = (req, res, next) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: 'Email ve şifre gerekli',
      error: 'MISSING_FIELDS'
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({
      message: 'Geçersiz email formatı',
      error: 'INVALID_EMAIL'
    });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({
      message: 'Şifre en az 6 karakter olmalı',
      error: 'WEAK_PASSWORD'
    });
  }

  if (role && !['user', 'admin'].includes(role)) {
    return res.status(400).json({
      message: 'Geçersiz rol',
      error: 'INVALID_ROLE'
    });
  }

  next();
};

// Login validasyonu
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: 'Email ve şifre gerekli',
      error: 'MISSING_FIELDS'
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({
      message: 'Geçersiz email formatı',
      error: 'INVALID_EMAIL'
    });
  }

  next();
};

// Konum validasyonu
const validateLocation = (req, res, next) => {
  const { latitude, longitude } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({
      message: 'Latitude ve longitude gerekli',
      error: 'MISSING_COORDINATES'
    });
  }

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({
      message: 'Koordinatlar sayı olmalı',
      error: 'INVALID_COORDINATES'
    });
  }

  if (latitude < -90 || latitude > 90) {
    return res.status(400).json({
      message: 'Latitude -90 ile 90 arasında olmalı',
      error: 'INVALID_LATITUDE'
    });
  }

  if (longitude < -180 || longitude > 180) {
    return res.status(400).json({
      message: 'Longitude -180 ile 180 arasında olmalı',
      error: 'INVALID_LONGITUDE'
    });
  }

  next();
};

// Toplu konum validasyonu
const validateBulkLocations = (req, res, next) => {
  const { locations } = req.body;

  if (!Array.isArray(locations) || locations.length === 0) {
    return res.status(400).json({
      message: 'Locations array gerekli ve boş olmamalı',
      error: 'INVALID_LOCATIONS_ARRAY'
    });
  }

  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    
    if (loc.latitude === undefined || loc.longitude === undefined) {
      return res.status(400).json({
        message: `Konum ${i}: Latitude ve longitude gerekli`,
        error: 'MISSING_COORDINATES'
      });
    }

    if (typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') {
      return res.status(400).json({
        message: `Konum ${i}: Koordinatlar sayı olmalı`,
        error: 'INVALID_COORDINATES'
      });
    }
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateLocation,
  validateBulkLocations
};
