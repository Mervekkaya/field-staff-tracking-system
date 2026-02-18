const express = require('express');
const router = express.Router();
const { register, login, getMe, logout } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');

// Public routes (token gerektirmez)
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected routes (token gerektirir)
router.get('/me', authenticateToken, getMe);
router.post('/logout', authenticateToken, logout);

// Test route (token gerektirir)
router.get('/protected', authenticateToken, (req, res) => {
  res.json({
    message: 'Bu korumalı bir endpoint',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;