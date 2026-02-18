const express = require('express');
const router = express.Router();
const {
  saveLocation,
  saveBulkLocations,
  getUserRecentLocations,
  getLocationsByDateRange,
  getLatestLocation
} = require('../controllers/locationController');
const { authenticateToken } = require('../middleware/auth');
const { validateLocation, validateBulkLocations } = require('../middleware/validation');

// Tek konum kaydet
router.post('/', authenticateToken, validateLocation, saveLocation);

// Toplu konum kaydet
router.post('/bulk', authenticateToken, validateBulkLocations, saveBulkLocations);

// Son konumları getir
router.get('/recent', authenticateToken, getUserRecentLocations);

// Tarih aralığına göre konumları getir
router.get('/date-range', authenticateToken, getLocationsByDateRange);

// En son konumu getir
router.get('/latest', authenticateToken, getLatestLocation);

module.exports = router;