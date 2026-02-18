const express = require('express');
const router = express.Router();
const { getAllUsers, getUserLocations, getAllUsersWithLocations, updateUser, deleteUser, createUser } = require('../controllers/adminController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Admin routes - only accessible by admin users
router.get('/users', authenticateToken, isAdmin, getAllUsers);
router.post('/users', authenticateToken, isAdmin, createUser);
router.get('/users/:userId/locations', authenticateToken, isAdmin, getUserLocations);
router.get('/users-with-locations', authenticateToken, isAdmin, getAllUsersWithLocations);
router.put('/users/:userId', authenticateToken, isAdmin, updateUser);
router.delete('/users/:userId', authenticateToken, isAdmin, deleteUser);

module.exports = router;